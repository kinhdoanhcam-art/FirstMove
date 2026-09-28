import { useEffect, useMemo, useState } from 'react'
import {
  Arrangement,
  connectWallet,
  normalizeError,
  openArrangementCalldataBytes,
  passiveWallet,
  settleWrite,
  stepOrder,
} from './genlayer'
import {
  CONTRACT_ADDRESS,
  contractExplorerUrl,
  transactionExplorerUrl,
} from './config'
import { arrangementIdFor, isArrangementId } from './ids'
import { requireArrangementAbsent } from './preflight.mjs'
import { pyLen, pyNormalizeWhitespace, pyStrip } from './pytext.mjs'

type Notice = {
  tone: 'info' | 'success' | 'error'
  text: string
  hash?: string
}

type Action = 'author' | 'other' | 'withdraw'

const short = (value: string, left = 7, right = 5) =>
  value ? `${value.slice(0, left)}…${value.slice(-right)}` : '—'

const lower = (value: string) => value.toLowerCase()

function waitingOn(item: Arrangement) {
  if (item.state === 'COMPLETE') return 'Both sides complete'
  if (item.state === 'WITHDRAWN') return 'Withdrawn before the first move'
  if (!item.author_confirmed && item.order === 'AUTHOR_FIRST') return 'the author'
  if (!item.other_confirmed && item.order === 'OTHER_FIRST') return item.other_label
  if (!item.author_confirmed) return 'the author'
  if (!item.other_confirmed) return item.other_label
  return 'accepted state refresh'
}

function reasonFor(item: Arrangement, action: Action, account: string) {
  const me = lower(account)
  if (!account) return 'Connect the wallet that owns this action'
  if (item.state === 'COMPLETE' || item.state === 'WITHDRAWN') return 'Arrangement is closed'

  if (action === 'author') {
    if (me !== lower(item.author)) return 'Only the author may confirm for the author'
    if (item.author_confirmed) return 'Author has already confirmed'
    if (item.order === 'OTHER_FIRST' && !item.other_confirmed) return 'The other side moves first'
  }

  if (action === 'other') {
    if (me !== lower(item.other_wallet)) return 'Only the named other side may confirm'
    if (item.other_confirmed) return 'Other side has already confirmed'
    if (item.order === 'AUTHOR_FIRST' && !item.author_confirmed) return 'The author moves first'
  }

  if (action === 'withdraw') {
    if (me !== lower(item.author)) return 'Only the author may withdraw'
    if (item.first_mover) return 'The first move has already been made'
    if (item.state !== 'OPEN') return 'Arrangement is closed'
  }

  return ''
}

function ArrangementCard({
  item,
  account,
  busy,
  onAction,
  onRefresh,
}: {
  item: Arrangement
  account: string
  busy: boolean
  onAction: (item: Arrangement, action: Action, note: string) => Promise<void>
  onRefresh: (id: string) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const authorReason = reasonFor(item, 'author', account)
  const otherReason = reasonFor(item, 'other', account)
  const withdrawReason = reasonFor(item, 'withdraw', account)
  const noteMissing = pyLen(pyStrip(note)) === 0

  return (
    <article className="arrangement-card">
      <div className="card-stripe" data-order={item.order} />
      <header className="card-head">
        <div>
          <p className="eyebrow">Accepted arrangement</p>
          <h3>{item.other_label} / author</h3>
        </div>
        <button className="icon-button" onClick={() => onRefresh(item.arrangement_id)} disabled={busy}>
          Refresh
        </button>
      </header>

      <div className="verdict-row">
        <span className={`verdict ${item.order === 'AUTHOR_FIRST' ? 'author' : 'other'}`}>
          {item.order.replace('_', ' ')}
        </span>
        <span className={`state state-${item.state.toLowerCase()}`}>{item.state}</span>
      </div>

      <blockquote>{item.text}</blockquote>

      <div className="sequence">
        <div className={item.author_confirmed ? 'party done' : 'party'}>
          <span>AUTHOR</span>
          <strong>{short(item.author)}</strong>
          <small>{item.author_confirmed ? 'confirmed' : 'not confirmed'}</small>
        </div>
        <div className="sequence-mark">
          <span>{item.order === 'AUTHOR_FIRST' ? '→' : '←'}</span>
          <small>{item.first_mover ? `first: ${item.first_mover}` : 'no first move'}</small>
        </div>
        <div className={item.other_confirmed ? 'party done' : 'party'}>
          <span>{item.other_label.toUpperCase()}</span>
          <strong>{short(item.other_wallet)}</strong>
          <small>{item.other_confirmed ? 'confirmed' : 'not confirmed'}</small>
        </div>
      </div>

      <div className="waiting-line">
        <span>Waiting on:</span>
        <strong>{waitingOn(item)}</strong>
      </div>

      <label className="field compact">
        <span>Confirmation note</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Describe the move being recorded"
          maxLength={300}
        />
        <small>{pyLen(pyStrip(note))}/300</small>
      </label>

      <div className="action-grid">
        <div>
          <button
            className="action author-action"
            disabled={busy || Boolean(authorReason) || noteMissing}
            onClick={() => onAction(item, 'author', note)}
          >
            Confirm (author)
          </button>
          <small>{authorReason || (noteMissing ? 'A note is required' : 'Ready')}</small>
        </div>
        <div>
          <button
            className="action other-action"
            disabled={busy || Boolean(otherReason) || noteMissing}
            onClick={() => onAction(item, 'other', note)}
          >
            Confirm (other side)
          </button>
          <small>{otherReason || (noteMissing ? 'A note is required' : 'Ready')}</small>
        </div>
        <div>
          <button
            className="action withdraw-action"
            disabled={busy || Boolean(withdrawReason)}
            onClick={() => onAction(item, 'withdraw', '')}
          >
            Withdraw
          </button>
          <small>{withdrawReason || 'Available before the first move'}</small>
        </div>
      </div>

      <footer className="id-row">
        <span>ID</span>
        <code>{item.arrangement_id}</code>
        <button onClick={() => navigator.clipboard.writeText(item.arrangement_id)}>Copy</button>
      </footer>
    </article>
  )
}

export default function App() {
  const [account, setAccount] = useState('')
  const [otherWallet, setOtherWallet] = useState('')
  const [otherLabel, setOtherLabel] = useState('')
  const [text, setText] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [createdId, setCreatedId] = useState('')
  const [arrangements, setArrangements] = useState<Arrangement[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const cleanText = pyStrip(text)
  const cleanLabel = pyNormalizeWhitespace(otherLabel)
  const textLength = pyLen(cleanText)
  const calldataBytes = useMemo(() => {
    try {
      return openArrangementCalldataBytes(otherWallet, cleanLabel, cleanText)
    } catch {
      return 0
    }
  }, [otherWallet, cleanLabel, cleanText])

  const upsert = (value: Arrangement) => {
    setArrangements((current) => {
      const next = current.filter((item) => item.arrangement_id !== value.arrangement_id)
      return [value, ...next].slice(0, 2)
    })
  }

  const load = async (id: string, announce = true) => {
    const cleanId = id.trim().toLowerCase()
    if (!isArrangementId(cleanId)) throw new Error('Arrangement ID must be 64 hexadecimal characters.')
    const value = await stepOrder.getArrangement(cleanId)
    upsert(value)
    if (announce) setNotice({ tone: 'success', text: 'Accepted state loaded.' })
    return value
  }

  useEffect(() => {
    passiveWallet().then(setAccount).catch(() => undefined)
    const ethereum = window.ethereum
    if (!ethereum?.on) return
    const handleAccounts = (accounts: string[]) => setAccount(accounts?.[0] || '')
    ethereum.on('accountsChanged', handleAccounts)
    return () => ethereum.removeListener?.('accountsChanged', handleAccounts)
  }, [])

  const handleConnect = async () => {
    try {
      setBusy(true)
      setAccount(await connectWallet())
      setNotice({ tone: 'success', text: 'Wallet connected to StudioNet.' })
    } catch (error) {
      setNotice({ tone: 'error', text: normalizeError(error) })
    } finally {
      setBusy(false)
    }
  }

  const handleLookup = async () => {
    try {
      setBusy(true)
      await load(lookupId)
    } catch (error) {
      setNotice({ tone: 'error', text: normalizeError(error) })
    } finally {
      setBusy(false)
    }
  }

  const handleOpen = async () => {
    try {
      if (!account) throw new Error('Connect the author wallet first.')
      if (!/^0x[a-fA-F0-9]{40}$/.test(otherWallet.trim())) throw new Error('Enter a valid other-side wallet.')
      if (lower(otherWallet.trim()) === lower(account)) throw new Error('The other side cannot be the author')
      if (!cleanLabel) throw new Error('Other-side label cannot be empty')
      if (pyLen(cleanLabel) > 80) throw new Error('Other-side label is too long')
      if (!cleanText) throw new Error('Arrangement text cannot be empty')
      if (textLength > 600) throw new Error('Arrangement text is too long')
      if (calldataBytes > 255) throw new Error('Serialized calldata exceeds the proven 255-byte path.')

      setBusy(true)
      const id = arrangementIdFor(account, cleanText)
      await requireArrangementAbsent(stepOrder.getArrangement, id)
      const hash = await stepOrder.openArrangement(account, otherWallet, cleanLabel, cleanText)
      setCreatedId(id)
      setLookupId(id)
      setNotice({ tone: 'info', text: 'Submitted — waiting for accepted state.', hash })

      const outcome = await settleWrite(hash, id, (value) => value.arrangement_id === id)
      if (outcome.status === 'SUCCESS') {
        upsert(outcome.arrangement)
        setNotice({ tone: 'success', text: 'Arrangement accepted and reloaded.', hash })
      } else {
        setNotice({
          tone: 'info',
          text: 'Submitted — confirmation delayed. Refresh the known ID; do not resubmit.',
          hash,
        })
      }
    } catch (error) {
      setNotice({ tone: 'error', text: normalizeError(error) })
    } finally {
      setBusy(false)
    }
  }

  const handleAction = async (item: Arrangement, action: Action, note: string) => {
    try {
      if (!account) throw new Error('Connect a wallet first.')
      const blockingReason = reasonFor(item, action, account)
      if (blockingReason) throw new Error(blockingReason)
      setBusy(true)

      let hash = ''
      let accepted: (value: Arrangement) => boolean
      if (action === 'author') {
        hash = await stepOrder.confirmAuthor(account, item.arrangement_id, note)
        accepted = (value) => value.author_confirmed
      } else if (action === 'other') {
        hash = await stepOrder.confirmOther(account, item.arrangement_id, note)
        accepted = (value) => value.other_confirmed
      } else {
        hash = await stepOrder.withdraw(account, item.arrangement_id)
        accepted = (value) => value.state === 'WITHDRAWN'
      }

      setNotice({ tone: 'info', text: 'Submitted — waiting for accepted state.', hash })
      const outcome = await settleWrite(hash, item.arrangement_id, accepted)
      if (outcome.status === 'SUCCESS') {
        upsert(outcome.arrangement)
        setNotice({ tone: 'success', text: 'Accepted state updated.', hash })
      } else {
        setNotice({
          tone: 'info',
          text: 'Submitted — confirmation delayed. Refresh state; do not resubmit.',
          hash,
        })
      }
    } catch (error) {
      setNotice({ tone: 'error', text: normalizeError(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FirstMove home">
          <img src="/firstmove-logo.png" alt="FirstMove" />
          <span><strong>FirstMove</strong><small>Order before outcome</small></span>
        </a>
        <div className="top-actions">
          <a href={contractExplorerUrl()} target="_blank" rel="noreferrer">Explorer ↗</a>
          <button onClick={handleConnect} disabled={busy}>
            {account ? short(account) : 'Connect wallet'}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Two parties · one ordering decision</p>
            <h1>Know who moves <em>first.</em></h1>
            <p>
              GenLayer reads the arrangement once. The contract then enforces that order
              deterministically while both parties remain able to finish.
            </p>
            <div className="hero-facts">
              <span>No escrow</span><span>No preview</span><span>Accepted-state reads</span>
            </div>
          </div>
          <div className="order-diagram" aria-label="First move sequence">
            <div><small>AUTHOR</small><strong>Move</strong></div>
            <span className="pulse">01</span>
            <div><small>OTHER SIDE</small><strong>Move</strong></div>
            <p>The wording decides which box becomes step 01.</p>
          </div>
        </section>

        {!CONTRACT_ADDRESS && (
          <div className="notice error">
            Contract address is not configured. Add <code>VITE_CONTRACT_ADDRESS</code> before using the app.
          </div>
        )}

        {notice && (
          <div className={`notice ${notice.tone}`}>
            <span>{notice.text}</span>
            {notice.hash && (
              <a href={transactionExplorerUrl(notice.hash)} target="_blank" rel="noreferrer">
                {short(notice.hash, 10, 8)} ↗
              </a>
            )}
          </div>
        )}

        <section className="workspace">
          <aside className="control-rail">
            <div className="panel-number">01</div>
            <h2>Open an arrangement</h2>
            <p className="muted">Only the connected author wallet can create it.</p>

            <label className="field">
              <span>Other-side wallet</span>
              <input value={otherWallet} onChange={(event) => setOtherWallet(event.target.value)} placeholder="0x…" />
            </label>
            <label className="field">
              <span>Other-side label</span>
              <input value={otherLabel} onChange={(event) => setOtherLabel(event.target.value)} placeholder="e.g. the Buyer" maxLength={80} />
              <small>{pyLen(cleanLabel)}/80</small>
            </label>
            <label className="field">
              <span>Arrangement text</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Write the real arrangement. No demo values are inserted." maxLength={600} />
              <small className={calldataBytes > 255 ? 'danger-text' : ''}>
                {textLength}/600 characters · {calldataBytes || 0}/255 serialized bytes
              </small>
            </label>
            {calldataBytes > 255 && <p className="field-warning">Above the RPC path proven by the live calldata probe.</p>}
            <button className="primary" onClick={handleOpen} disabled={busy || !CONTRACT_ADDRESS || calldataBytes > 255}>
              {busy ? 'Working…' : 'Open arrangement'}
            </button>

            {createdId && (
              <div className="created-id">
                <span>Latest computed ID</span>
                <code>{createdId}</code>
                <button onClick={() => navigator.clipboard.writeText(createdId)}>Copy ID</button>
              </div>
            )}

            <hr />
            <div className="panel-number">02</div>
            <h2>Load accepted state</h2>
            <label className="field">
              <span>Arrangement ID</span>
              <input value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="64 hexadecimal characters" />
            </label>
            <button className="secondary" onClick={handleLookup} disabled={busy || !CONTRACT_ADDRESS}>
              Load arrangement
            </button>
          </aside>

          <section className="state-board">
            <header>
              <div>
                <p className="eyebrow">Accepted state only</p>
                <h2>Order board</h2>
              </div>
              <span>{arrangements.length}/2 visible</span>
            </header>

            {arrangements.length === 0 ? (
              <div className="empty-state">
                <img src="/firstmove-logo.png" alt="" />
                <h3>No arrangement loaded</h3>
                <p>Create one or load an ID. Put two opposite arrangements side by side to see the controls reverse.</p>
              </div>
            ) : (
              <div className="arrangement-grid">
                {arrangements.map((item) => (
                  <ArrangementCard
                    key={item.arrangement_id}
                    item={item}
                    account={account}
                    busy={busy}
                    onAction={handleAction}
                    onRefresh={async (id) => {
                      await load(id)
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      </main>

      <footer className="footer">
        <span>FirstMove · GenLayer StudioNet 61999</span>
        <span>{CONTRACT_ADDRESS ? short(CONTRACT_ADDRESS, 10, 8) : 'Awaiting Project contract address'}</span>
      </footer>
    </div>
  )
}
