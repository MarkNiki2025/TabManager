import { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import { DEFAULT_TABS, FIRSTTAB } from './tabsData.js'

const MORE_BTN_WIDTH = 40 
const FIRST_ICON_WIDTH = 34 
const GAP = 4 

function Tabs() {
  const [tabs, setTabs] = useState(DEFAULT_TABS)
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredTab, setHoveredTab] = useState(null)

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
        const widthWithGap = tabWidth + GAP

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

  function togglePin (id) {
  setTabs(prev =>
    prev.map(tab =>
      tab.id === id
        ? { ...tab, pinned: !tab.pinned }
        : tab
    )
  )
  }

  return (
    <>
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
        className="tab-item" 
        onMouseEnter={() => setHoveredTab(tab.id)}
      >
        <a href={tab.url}>
          <img src={tab.icon} alt={tab.title} className="tab-icon" />
          {tab.title}
        </a>
        <div
          className='tab-wrapper'
        >
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
          <img
            src={'/pin.svg'}
            alt="pin"
          />
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
        onClick={() => setIsOpen(!isOpen)}
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
    </>
  )
}

export default Tabs