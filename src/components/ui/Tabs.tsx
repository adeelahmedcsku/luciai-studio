import React, { useState, ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth = false,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantStyles = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent hover:border-gray-300',
      activeTab: 'border-blue-500 text-blue-600',
      inactiveTab: 'text-gray-600',
    },
    enclosed: {
      container: 'border-b border-gray-200',
      tab: 'border border-transparent rounded-t-lg hover:border-gray-300',
      activeTab: 'border-gray-200 border-b-white bg-white -mb-px text-blue-600',
      inactiveTab: 'text-gray-600',
    },
    pills: {
      container: '',
      tab: 'rounded-lg hover:bg-gray-100',
      activeTab: 'bg-blue-600 text-white hover:bg-blue-700',
      inactiveTab: 'text-gray-600',
    },
  };
  
  const styles = variantStyles[variant];
  const currentTab = tabs.find(tab => tab.id === activeTab);
  
  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className={`flex gap-1 ${styles.container} ${fullWidth ? '' : 'overflow-x-auto'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-2 font-medium transition-all duration-200
              ${sizeClasses[size]}
              ${styles.tab}
              ${activeTab === tab.id ? styles.activeTab : styles.inactiveTab}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${fullWidth ? 'flex-1 justify-center' : ''}
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {currentTab?.content}
      </div>
    </div>
  );
};

// Example usage:
/*
const tabs = [
  {
    id: 'tab1',
    label: 'Profile',
    icon: <UserIcon />,
    content: <div>Profile content</div>,
  },
  {
    id: 'tab2',
    label: 'Settings',
    icon: <SettingsIcon />,
    content: <div>Settings content</div>,
  },
  {
    id: 'tab3',
    label: 'Disabled',
    content: <div>This tab is disabled</div>,
    disabled: true,
  },
];

<Tabs
  tabs={tabs}
  variant="line"
  size="md"
  onChange={(tabId) => console.log('Tab changed:', tabId)}
/>
*/
