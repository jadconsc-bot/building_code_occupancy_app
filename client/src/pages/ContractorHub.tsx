import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

const TOOLS = [
  {
    id: 'deck',
    icon: '🪵',
    title: 'Deck Builder',
    description: 'Guard rails, footings, beam sizing',
    color: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-700',
  },
  {
    id: 'suite',
    icon: '🏠',
    title: 'Suite Checker',
    description: 'Ceiling, egress, fire separation',
    color: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-700',
  },
  {
    id: 'window',
    icon: '🪟',
    title: 'Window Sizer',
    description: 'Egress window & well requirements',
    color: 'bg-green-50 border-green-200',
    accent: 'text-green-700',
  },
  {
    id: 'drain',
    icon: '🚿',
    title: 'Drain Calculator',
    description: 'Fixture units → pipe size',
    color: 'bg-purple-50 border-purple-200',
    accent: 'text-purple-700',
  },
  {
    id: 'snow',
    icon: '❄️',
    title: 'Snow Load',
    description: 'Roof load by city + slope',
    color: 'bg-sky-50 border-sky-200',
    accent: 'text-sky-700',
  },
  {
    id: 'setback',
    icon: '📏',
    title: 'Setback Check',
    description: 'Max windows near property line',
    color: 'bg-orange-50 border-orange-200',
    accent: 'text-orange-700',
  },
  {
    id: 'permit',
    icon: '📋',
    title: 'Permit Required?',
    description: 'Do I need a permit for this?',
    color: 'bg-red-50 border-red-200',
    accent: 'text-red-700',
  },
];

function getCredits(): number {
  const stored = localStorage.getItem('cc_contractor_credits');
  return stored !== null ? parseInt(stored, 10) : 2;
}

function hasSub(): boolean {
  return localStorage.getItem('cc_contractor_sub') === 'true';
}

export default function ContractorHub() {
  const [, setLocation] = useLocation();
  const credits = getCredits();
  const subscribed = hasSub();

  const checkoutMutation = trpc.subscriptions.createContractorSession.useMutation({
    onSuccess: (data: { checkoutUrl: string }) => { window.location.href = data.checkoutUrl; },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔨</span>
          <h1 className="text-xl font-bold">CodeComply Contractor</h1>
        </div>
        <p className="text-blue-200 text-sm">
          Alberta building code tools for the job site
        </p>
        <div className="mt-3 bg-blue-800/50 rounded-lg px-3 py-2 flex items-center justify-between">
          {subscribed ? (
            <span className="text-xs text-green-300 font-medium">✓ Unlimited access</span>
          ) : (
            <span className="text-xs text-blue-200">
              {credits} calculation{credits !== 1 ? 's' : ''} remaining
            </span>
          )}
          {!subscribed && (
            <button
              className="text-xs text-amber-300 font-medium"
              onClick={() => checkoutMutation.mutate({ type: 'subscription' })}
            >
              Get more →
            </button>
          )}
        </div>
      </div>

      {/* Tool grid */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3 max-w-md mx-auto">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setLocation(`/contractor/${tool.id}`)}
            className={`${tool.color} border rounded-xl p-4 text-left active:scale-95 transition-transform`}
          >
            <div className="text-3xl mb-2">{tool.icon}</div>
            <div className={`font-semibold text-sm ${tool.accent}`}>{tool.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{tool.description}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground">
        Alberta Part 9 • NBC 2020 • ABC 2019
      </div>
    </div>
  );
}
