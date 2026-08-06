import { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import { DEFAULT_TABS, FIRSTTAB } from './tabsData.js'

const MORE_BTN_WIDTH = 40
const FIRST_ICON_WIDTH = 34
const CROSS = 20
const GAP = 4
const STORAGE_KEY = 'tabs-order'

function loadTabs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.error('Не вдалось завантажити таби:', e)
  }
  return DEFAULT_TABS
}

function Tabs() {
  const [tabs, setTabs] = useState(loadTabs)
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredTab, setHoveredTab] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  useLayoutEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
    } catch (e) {
      console.error('Не вдалось зберегти таби:', e)
    }
  }, [tabs])

  const sortedTabs = useMemo(() => {
    return [
      ...tabs.filter(t => t.pinned),
      ...tabs.filter(t => !t.pinned),
    ]
  }, [tabs])

  const [visibleTabs, setVisibleTabs] = useState([])
  const [hiddenTabs, setHiddenTabs] = useState([])

  const containerRef = useRef(null)
  const tabRefs = useRef({})

  const calculateVisibleTabs = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const style = getComputedStyle(container)
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const containerWidth = container.offsetWidth - paddingX

    const fitTabs = (reserveForButton) => {
      let usedWidth = FIRST_ICON_WIDTH + GAP + (reserveForButton ? MORE_BTN_WIDTH + GAP : 0)
      const visible = []
      const hidden = []

      for (const tab of sortedTabs) {
        const tabWidth = tabRefs.current[tab.id] || 0
        const widthWithGap = tabWidth + GAP + CROSS

        if (usedWidth + widthWithGap <= containerWidth) {
          usedWidth += widthWithGap
          visible.push(tab)
        } else {
          hidden.push(tab)
        }
      }
      return { visible, hidden }
    }

    const withoutButton = fitTabs(false)

    if (withoutButton.hidden.length === 0) {
      setVisibleTabs(withoutButton.visible)
      setHiddenTabs([])
    } else {
      const withButton = fitTabs(true)
      setVisibleTabs(withButton.visible)
      setHiddenTabs(withButton.hidden)
    }
  }, [sortedTabs])

  useLayoutEffect(() => {
    const measure = () => {
      const measureNode = document.getElementById('tabs-measure')
      if (measureNode) {
        measureNode.querySelectorAll('[data-tab-id]').forEach((el) => {
          tabRefs.current[el.dataset.tabId] = el.offsetWidth
        })
      }
      calculateVisibleTabs()
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure)
    } else {
      measure()
    }

    const resizeObserver = new ResizeObserver(calculateVisibleTabs)
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [calculateVisibleTabs])

  function togglePin(id) {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === id
          ? { ...tab, pinned: !tab.pinned }
          : tab
      )
    )
  }

  function removeTab(id) {
    setTabs(prev => prev.filter(tab => tab.id !== id))
  }

  function handleDragStart(e, id) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, id) {
    e.preventDefault()
    if (id !== dragOverId) setDragOverId(id)
  }

  function handleDrop(e, targetId) {
    e.preventDefault()
    setDragOverId(null)

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    setTabs(prev => {
      const list = [...prev]
      const fromIndex = list.findIndex(t => t.id === draggedId)
      const toIndex = list.findIndex(t => t.id === targetId)
      if (fromIndex === -1 || toIndex === -1) return prev

      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)
      return list
    })

    setDraggedId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <>
    <header onClick={() => setIsOpen(false)}>
      <div
        className="tabs"
        id="tabs-measure"
        style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden', display: 'flex' }}
      >
        {sortedTabs.map((tab) => (
          <a key={tab.id} data-tab-id={tab.id} href={tab.url}>
            <img src={tab.icon} alt={tab.title} className="tab-icon" />
            {tab.title}
          </a>
        ))}
      </div>

  <div className="tabs" ref={containerRef}>
    <div
      className="first-tab-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
    <img src={FIRSTTAB.icon} alt={FIRSTTAB.title} />

    {showTooltip && (
      <div className="tab-tooltip">
        <img src={FIRSTTAB.icon} alt="" className="tooltip-icon" />
        <span>{FIRSTTAB.title}</span>
      </div>
    )}
    </div>

    {visibleTabs.map((tab) => (
      <div
        key={tab.id}
        className={`tab-item ${draggedId === tab.id ? 'dragging' : ''} ${dragOverId === tab.id && draggedId !== tab.id ? 'drag-over' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, tab.id)}
        onDragOver={(e) => handleDragOver(e, tab.id)}
        onDrop={(e) => handleDrop(e, tab.id)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setHoveredTab(tab.id)}
      >
        <div className='tab-conteiner'>
          <a href={tab.url}>
            <img src={tab.icon} alt={tab.title} className="tab-icon" />
            {tab.title}
          </a>
        </div>

        {hoveredTab === tab.id && (
          <button
            className='button-cross'
            onClick={(e) => {
              e.preventDefault()
              removeTab(tab.id)
            }}
          >
            ✕
          </button>
        )}

        <div className='tab-wrapper'>
          {hoveredTab === tab.id && (
            <div className='pinTag' onMouseEnter={() => setHoveredTab(tab.id)} onMouseLeave={() => setHoveredTab(null)}>
              <button
                className="pin-button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  togglePin(tab.id)
                  setHoveredTab(tab.id)
                }}
              >
                <img src={'/pin.svg'} alt="pin" />
                <span>Tab {tab.pinned ? 'ab' : 'an'}pinnen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    ))}

    {hiddenTabs.length > 0 && (
      <div className="tabs-more">
        <button
          className={`tabs-more-btn ${isOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          <svg className="chevron-icon" viewBox="0 0 24 24" fill="none">
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isOpen && (
          <div className="tabs-dropdown">
            {hiddenTabs.map((tab) => (
              <div key={tab.id} className="tabs-dropdown-item">
                <img src={tab.icon} alt={tab.title} className="item-icon" />
                {tab.title}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</header>
</>
  )
}

export default Tabs