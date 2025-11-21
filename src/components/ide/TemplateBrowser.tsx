import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Code,
  Layers,
  Zap,
  Filter,
  CheckCircle,
} from 'lucide-react';
import {
  useTemplates,
  groupByCategory,
  getDifficultyColor,
  getCategoryIcon,
  ProjectTemplate,
} from '../../hooks/useTemplates';

interface TemplateBrowserProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export default function TemplateBrowser({ onSelectTemplate }: TemplateBrowserProps) {
  const { templates, isLoading, searchTemplates } = useTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchTemplates(query);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (selectedDifficulty && t.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const groupedTemplates = groupByCategory(filteredTemplates);
  const categories = Object.keys(groupedTemplates);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold">Project Templates</h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">All Categories</option>
              <option value="Web">🌐 Web</option>
              <option value="Mobile">📱 Mobile</option>
              <option value="Desktop">💻 Desktop</option>
              <option value="CLI">⌨️ CLI</option>
              <option value="API">🔌 API</option>
              <option value="FullStack">🚀 Full Stack</option>
              <option value="DataScience">📊 Data Science</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={selectedDifficulty || ''}
              onChange={(e) => setSelectedDifficulty(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading templates...</p>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No templates found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  {category}
                  <span className="text-sm text-gray-500">
                    ({groupedTemplates[category].length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTemplates[category].map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => onSelectTemplate(template)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div
      onClick={onSelect}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-white">{template.name}</h4>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
            template.difficulty
          )}`}
        >
          {template.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{template.description}</p>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-1 mb-3">
        {template.tech_stack.slice(0, 3).map((tech) => (
          <span
            key={tech}
            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
          >
            {tech}
          </span>
        ))}
        {template.tech_stack.length > 3 && (
          <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
            +{template.tech_stack.length - 3}
          </span>
        )}
      </div>

      {/* Features */}
      <div className="space-y-1 mb-3">
        {template.features.slice(0, 2).map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="truncate">{feature}</span>
          </div>
        ))}
        {template.features.length > 2 && (
          <div className="text-xs text-gray-500">
            +{template.features.length - 2} more features
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
        <span className="flex items-center gap-1">
          <Code className="w-3 h-3" />
          ~{template.estimated_files} files
        </span>
        <button className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors">
          <Sparkles className="w-3 h-3" />
          Use Template
        </button>
      </div>
    </div>
  );
}
