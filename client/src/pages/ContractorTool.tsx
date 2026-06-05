import { useParams, useLocation } from 'wouter';
import { PayPerUseGate } from '@/components/contractor/PayPerUseGate';
import { DeckBuilderTool }  from '@/components/contractor/DeckBuilderTool';
import { SuiteCheckerTool } from '@/components/contractor/SuiteCheckerTool';
import { WindowSizerTool }  from '@/components/contractor/WindowSizerTool';
import { DrainCalcTool }    from '@/components/contractor/DrainCalcTool';
import { SnowLoadTool }     from '@/components/contractor/SnowLoadTool';
import { SetbackCheckTool } from '@/components/contractor/SetbackCheckTool';
import { PermitCheckerTool }from '@/components/contractor/PermitCheckerTool';

const TOOL_META: Record<string, { title: string; component: React.ComponentType }> = {
  deck:    { title: '🪵 Deck Builder',         component: DeckBuilderTool },
  suite:   { title: '🏠 Suite Checker',         component: SuiteCheckerTool },
  window:  { title: '🪟 Window Sizer',          component: WindowSizerTool },
  drain:   { title: '🚿 Drain Calculator',      component: DrainCalcTool },
  snow:    { title: '❄️ Snow Load',              component: SnowLoadTool },
  setback: { title: '📏 Setback Check',         component: SetbackCheckTool },
  permit:  { title: '📋 Permit Required?',      component: PermitCheckerTool },
};

export default function ContractorTool() {
  const params = useParams<{ tool: string }>();
  const [, setLocation] = useLocation();
  const toolId = params.tool ?? '';
  const meta = TOOL_META[toolId];

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <p className="text-lg font-semibold text-gray-700 mb-4">Tool not found</p>
        <button
          onClick={() => setLocation('/contractor')}
          className="text-sm text-blue-600 underline"
        >
          ← Back to tools
        </button>
      </div>
    );
  }

  const ToolComponent = meta.component;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Tool header */}
      <div className="bg-[#1B3A6B] text-white px-4 pt-10 pb-4">
        <button
          onClick={() => setLocation('/contractor')}
          className="text-blue-300 text-sm mb-3 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">{meta.title}</h1>
      </div>

      {/* Pay-per-use gate wraps the tool */}
      <PayPerUseGate toolName={toolId}>
        <ToolComponent />
      </PayPerUseGate>
    </div>
  );
}
