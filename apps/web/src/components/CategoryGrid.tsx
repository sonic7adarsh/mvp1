import React, { useRef } from 'react'

interface CategoryGridProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getCategoryIconPath = (cat: string) => {
    const key = cat.toLowerCase()
    // Map slugs/names to icon files
    const map: Record<string, string> = {
      'all': '/icons/all.svg',
      'grocery': '/icons/grocery.svg',
      'groceries & staples': '/icons/grocery.svg',
      'fresh produce': '/icons/fresh.svg',
      'fresh': '/icons/fresh.svg',
      'dairy': '/icons/dairy.svg',
      'dairy & bakery': '/icons/dairy.svg',
      'bakery': '/icons/dairy.svg',
      'snacks': '/icons/snacks.svg',
      'snacks & beverages': '/icons/snacks.svg',
      'beauty': '/icons/beauty.svg',
      'personal care & beauty': '/icons/beauty.svg',
      'household': '/icons/household.svg',
      'household essentials': '/icons/household.svg',
      'baby': '/icons/baby_pet.svg',
      'baby & pet care': '/icons/baby_pet.svg',
      'electronics': '/icons/electronics.svg',
      'electronics & lifestyle': '/icons/electronics.svg',
      'pharmacy': '/icons/pharmacy.svg',
      'specialty': '/icons/pharmacy.svg',
      'automotive': '/icons/automotive.svg',
      'restaurant': '/icons/restaurant.svg',
    }
    return map[key] || '/icons/grocery.svg' // Fallback
  }

  const getCategoryLabel = (cat: string) => {
    const key = cat.toLowerCase()
    const map: Record<string, string> = {
        'all': 'All',
        'grocery': 'Groceries & Staples',
        'fresh': 'Fresh Produce',
        'dairy': 'Dairy & Bakery',
        'snacks': 'Snacks & Beverages',
        'beauty': 'Personal Care & Beauty',
        'household': 'Household Essentials',
        'baby': 'Baby & Pet Care',
        'electronics': 'Electronics & Lifestyle',
        'pharmacy': 'Pharmacy',
        'specialty': 'Specialty',
        'automotive': 'Automotive',
        'restaurant': 'Restaurants',
    }
    // Fallback: Capitalize first letter
    return map[key] || cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex', 
    flexDirection: 'row',
    gap: '12px', 
    overflowX: 'auto',
    padding: '8px 16px', // Horizontal padding for edge-to-edge scroll
    width: '100%',
    scrollbarWidth: 'none', // Hide scrollbar Firefox
    msOverflowStyle: 'none', // Hide scrollbar IE/Edge
    WebkitOverflowScrolling: 'touch', // Smooth scrolling iOS
    scrollBehavior: 'smooth',
  }

  // The Card Container
  const itemWrapperStyle: React.CSSProperties = {
    height: '52px', // Reduced Height (Half of 96 approx)
    minWidth: '52px', // Compact Width
    padding: '4px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    flexShrink: 0,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', // Reduced shadow
    border: '1px solid #F3F4F6',
  }

  const iconWrapperStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // background: 'transparent', // Implicit
  }

  const labelStyle: React.CSSProperties = {
    marginTop: '0px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#111827',
    lineHeight: '1',
    textAlign: 'center',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={scrollRef}
        style={containerStyle}
        className="no-scrollbar" // Global utility class
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat
          const isActive = selectedCategory === 'all' ? cat === 'all' : selectedCategory === cat

          return (
            <div 
              key={cat} 
              onClick={() => onSelectCategory(cat)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                opacity: isActive ? 1 : 0.7,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{
                ...itemWrapperStyle,
                border: isActive ? '2px solid #000' : '1px solid #E5E7EB',
                backgroundColor: isActive ? '#F3F4F6' : '#FFFFFF',
              }}>
                <img 
                  src={getCategoryIconPath(cat)} 
                  alt={cat}
                  style={{ width: '28px', height: '28px' }}
                />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                color: '#111827',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                maxWidth: '64px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {getCategoryLabel(cat)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
