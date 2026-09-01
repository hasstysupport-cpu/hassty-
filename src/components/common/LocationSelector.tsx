import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { EGYPT_GOVERNORATES, CITIES_BY_GOVERNORATE } from '../../data/mockData';

interface LocationSelectorProps {
  selectedGovernorate: string;
  selectedCity?: string;
  onSelectGovernorate: (gov: string) => void;
  onSelectCity?: (city: string) => void;
  showCitySelect?: boolean;
  className?: string;
  placeholder?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedGovernorate,
  selectedCity = '',
  onSelectGovernorate,
  onSelectCity,
  showCitySelect = false,
  className = '',
  placeholder = 'اختر المحافظة...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'gov' | 'city'>('gov');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Governorates
  const filteredGovernorates = EGYPT_GOVERNORATES.filter((gov) =>
    gov.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // Filtered Cities for currently selected governorate
  const currentCities = selectedGovernorate ? CITIES_BY_GOVERNORATE[selectedGovernorate] || [] : [];
  const filteredCities = currentCities.filter((city) =>
    city.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleGovPick = (gov: string) => {
    onSelectGovernorate(gov);
    if (showCitySelect && onSelectCity) {
      onSelectCity('');
      setActiveTab('city');
      setSearchTerm('');
    } else {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleCityPick = (city: string) => {
    if (onSelectCity) {
      onSelectCity(city);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectGovernorate('');
    if (onSelectCity) onSelectCity('');
    setActiveTab('gov');
  };

  const displayLabel = () => {
    if (!selectedGovernorate) return placeholder;
    if (showCitySelect && selectedCity) {
      return `${selectedGovernorate} - ${selectedCity}`;
    }
    return selectedGovernorate;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1F2937] hover:border-blue-300 hover:bg-white focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className={`truncate text-xs sm:text-sm font-medium ${selectedGovernorate ? 'text-[#1F2937] font-bold' : 'text-gray-400'}`}>
            {displayLabel()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedGovernorate && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              title="إلغاء التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2563EB]' : ''}`} />
        </div>
      </div>

      {/* Floating Modal / Popover Dropdown (Mobile-Optimized) */}
      {isOpen && (
        <>
          {/* Mobile backdrop for seamless outside clicks & focus trap */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 sm:left-0 bottom-4 sm:bottom-auto sm:top-full sm:mt-2 bg-white border border-gray-200 rounded-3xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden animate-drawer sm:min-w-[280px] max-h-[80vh] sm:max-h-80 flex flex-col">
            
            {/* Mobile Header / Drag handle */}
            <div className="sm:hidden flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/90">
              <span className="text-xs font-bold text-gray-800">اختر المحافظة / المدينة</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs if city select is enabled */}
            {showCitySelect && selectedGovernorate && (
              <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveTab('gov'); setSearchTerm(''); }}
                  className={`flex-1 py-2 sm:py-1.5 rounded-xl sm:rounded-lg transition-all text-center ${
                    activeTab === 'gov' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-gray-500 hover:text-[#1F2937]'
                  }`}
                >
                  1. المحافظة ({selectedGovernorate})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('city'); setSearchTerm(''); }}
                  className={`flex-1 py-2 sm:py-1.5 rounded-xl sm:rounded-lg transition-all text-center ${
                    activeTab === 'city' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-gray-500 hover:text-[#1F2937]'
                  }`}
                >
                  2. المدينة / المركز {selectedCity ? `(${selectedCity})` : ''}
                </button>
              </div>
            )}

            {/* Quick Search Input inside Dropdown */}
            <div className="p-2.5 border-b border-gray-100 bg-white shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'gov' ? 'ابحث عن اسم المحافظة (27 محافظة)...' : `ابحث في مدن ${selectedGovernorate}...`}
                  className="w-full pr-9 pl-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-[#1F2937] placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#2563EB] text-right"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 text-right custom-scrollbar flex-1 max-h-56 sm:max-h-60">
              {activeTab === 'gov' ? (
                // Governorates List
                <>
                  <button
                    type="button"
                    onClick={() => { onSelectGovernorate(''); if (onSelectCity) onSelectCity(''); setIsOpen(false); }}
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between text-right transition-colors cursor-pointer ${
                      !selectedGovernorate ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>كل المحافظات (الجمهورية كاملة)</span>
                    {!selectedGovernorate && <Check className="w-4 h-4 text-[#2563EB]" />}
                  </button>

                  {filteredGovernorates.length > 0 ? (
                    filteredGovernorates.map((gov) => {
                      const isSelected = selectedGovernorate === gov;
                      const cityCount = (CITIES_BY_GOVERNORATE[gov] || []).length;
                      return (
                        <button
                          key={gov}
                          type="button"
                          onClick={() => handleGovPick(gov)}
                          className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between text-right transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#1F2937] hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{gov}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md font-normal">
                              {cityCount} منطقة
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB]" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      لم نتمكن من إيجاد محافظة تطابق "{searchTerm}"
                    </div>
                  )}
                </>
              ) : (
                // Cities List
                <>
                  {onSelectCity && (
                    <button
                      type="button"
                      onClick={() => handleCityPick('')}
                      className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between text-right transition-colors cursor-pointer ${
                        !selectedCity ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>كل مناطق ومدن {selectedGovernorate}</span>
                      {!selectedCity && <Check className="w-4 h-4 text-[#2563EB]" />}
                    </button>
                  )}

                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => {
                      const isSelected = selectedCity === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCityPick(city)}
                          className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between text-right transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#1F2937] hover:bg-gray-50'
                          }`}
                        >
                          <span>{city}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB]" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      لم نتمكن من إيجاد منطقة تطابق "{searchTerm}"
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer note */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 text-[11px] text-[#6B7280] text-center shrink-0">
              تغطية شاملة لـ 27 محافظة وأكثر من 300 مدينة ومركز
            </div>
          </div>
        </>
      )}
    </div>
  );
};
