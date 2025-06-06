import React from 'react';

export type ChecklistItem = {
  id: string;
  category: string;
  question: string;
  explanation: string;
  answer?: string;
};

export type ChecklistProps = {
  items: ChecklistItem[];
  totalSteps?: number;
  currentStep?: number;
  completedCategories?: string[];
  isComplete?: boolean;
};

const CATEGORY_NAMES: Record<string, string> = {
  agent_relationship: 'Agent Relationship',
  local_knowledge: 'Local Knowledge',
  process_familiarity: 'Process Familiarity',
  communication_availability: 'Communication & Availability',
  budget_fees: 'Budget, Fees & Commission',
  loan_eligibility: 'Loan Eligibility',
  property_type: 'Property Type',
  lifestyle_cultural_fit: 'Lifestyle & Cultural Fit',
};

export const RealEstateChecklist: React.FC<ChecklistProps> = ({ items, totalSteps, currentStep, completedCategories = [], isComplete }) => {
  // Group items by category
  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Copy checklist as text
  const handleCopy = () => {
    const text = Object.entries(grouped)
      .map(
        ([category, items]) =>
          `## ${CATEGORY_NAMES[category] || category}\n` +
          items
            .map(
              (item, idx) =>
                `${idx + 1}. ${item.question}\n   - ${item.explanation}${item.answer ? `\n   User Answer: ${item.answer}` : ''}`
            )
            .join('\n')
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  // Download checklist as text file
  const handleDownload = () => {
    const text = Object.entries(grouped)
      .map(
        ([category, items]) =>
          `## ${CATEGORY_NAMES[category] || category}\n` +
          items
            .map(
              (item, idx) =>
                `${idx + 1}. ${item.question}\n   - ${item.explanation}${item.answer ? `\n   User Answer: ${item.answer}` : ''}`
            )
            .join('\n')
      )
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'real-estate-checklist.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Progress indicator
  const progress = totalSteps && currentStep ? Math.round((currentStep / totalSteps) * 100) : undefined;

  return (
    <aside className="w-full md:w-96 p-4 bg-gray-50 border-l border-gray-200 overflow-y-auto" aria-label="Real estate interview progress panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" id="checklist-heading">Your Progress</h2>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleCopy}
            aria-label="Copy checklist to clipboard"
            tabIndex={0}
          >
            Copy
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleDownload}
            aria-label="Download checklist as text file"
            tabIndex={0}
          >
            Download
          </button>
        </div>
      </div>
      {progress !== undefined && !isComplete && (
        <div className="mb-4">
          <div className="text-sm text-gray-700">Step {currentStep} of {totalSteps}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div aria-live="polite" aria-atomic="true" aria-labelledby="checklist-heading">
        {Object.entries(grouped).length === 0 ? (
          <p className="text-gray-500">No questions answered yet. As you chat, your progress will appear here.</p>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="mb-6" aria-label={CATEGORY_NAMES[category] || category}>
              <div className="flex items-center mb-2">
                <h3 className="font-medium text-blue-700 mr-2">{CATEGORY_NAMES[category] || category}</h3>
                {completedCategories.includes(category) && (
                  <span className="text-green-600 text-lg ml-1" aria-label="Category complete" title="Category complete">✔️</span>
                )}
              </div>
              <ol className="list-decimal list-inside space-y-1">
                {items.map((item, idx) => (
                  <li key={item.id} tabIndex={0} className="outline-none focus:ring-2 focus:ring-blue-300">
                    <span className="font-semibold">{item.question}</span>
                    <div className="text-xs text-gray-600 ml-4">{item.explanation}</div>
                    {item.answer && (
                      <div className="text-xs text-gray-800 ml-4 mt-1"><span className="font-semibold">Your answer:</span> {item.answer}</div>
                    )}
                  </li>
                ))}
              </ol>
              {completedCategories.includes(category) && (
                <div className="text-green-700 text-xs mt-2">🎉 You've completed this category!</div>
              )}
            </section>
          ))
        )}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <div className="text-green-800 font-semibold mb-2">All done!</div>
            <div className="text-green-700 text-sm">You've completed your real estate agent interview prep. You can copy or download your personalized checklist above.</div>
          </div>
        )}
      </div>
    </aside>
  );
}; 