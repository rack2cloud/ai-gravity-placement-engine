import providersData from '../data/providers.json';

export interface Provider {
  id: string;
  name: string;
  unit_rate_gpu_hr: number;
  egress_gb: number;
  is_sovereign_eligible: boolean;
  type: 'public' | 'specialized' | 'private';
  footnote: string;
}

export interface EngineInputs {
  datasetSizeGB: number;
  monthlyTokensMillions: number;
  dutyCycle: number;
  opexAdder: number;
  complianceMode: boolean;
}

export interface EngineOutput {
  providerId: string;
  monthlyCompute: number;
  egressTax: number;
  totalMonthlyTCO: number;
  tokenTCO: number;
  gravityScore: number;
  gravityDisplay: string;
  isEligible: boolean;
}

export const calculatePlacement = (inputs: EngineInputs): EngineOutput[] => {
  const { providers } = providersData;
  const HOURS_PER_MONTH = 730;
  const GPUS_IN_CLUSTER = 8;

  return providers.map((p: any) => {
    const provider = p as Provider;

    if (inputs.complianceMode && !provider.is_sovereign_eligible) {
      return {
        providerId: provider.id,
        monthlyCompute: 0,
        egressTax: 0,
        totalMonthlyTCO: 0,
        tokenTCO: 0,
        gravityScore: 0,
        gravityDisplay: "Ineligible",
        isEligible: false,
      };
    }

    let hourlyRatePerGPU = provider.unit_rate_gpu_hr;

    if (provider.type === 'private') {
      const rawAmortized = hourlyRatePerGPU / 1.20;
      hourlyRatePerGPU = rawAmortized * (1 + inputs.opexAdder);
    } else {
      hourlyRatePerGPU = hourlyRatePerGPU * inputs.dutyCycle;
    }

    const monthlyCompute = hourlyRatePerGPU * GPUS_IN_CLUSTER * HOURS_PER_MONTH;
    const egressTax = inputs.datasetSizeGB * provider.egress_gb;
    const totalMonthlyTCO = monthlyCompute + egressTax;

    const tokenTCO = inputs.monthlyTokensMillions > 0 
      ? totalMonthlyTCO / inputs.monthlyTokensMillions 
      : 0;

    const gravityScore = monthlyCompute > 0 ? egressTax / monthlyCompute : 0;
    
    let gravityDisplay = `${(gravityScore * 100).toFixed(1)}%`;
    if (provider.type === 'private') {
      gravityDisplay = "N/A — Co-located";
    } else if (provider.id === 'lambda_h100') {
      gravityDisplay = "0.0%*";
    }

    return {
      providerId: provider.id,
      monthlyCompute,
      egressTax,
      totalMonthlyTCO,
      tokenTCO,
      gravityScore,
      gravityDisplay,
      isEligible: true,
    };
  });
};

export const getVerdict = (output: EngineOutput, inputs: EngineInputs) => {
  if (output.gravityScore > 0.5) {
    return {
      verdict: "Critical Gravity / Stay Put",
      reasoning: `Your Egress Tax ($${output.egressTax.toLocaleString()}) exceeds 50% of your compute cost. The friction of moving this dataset makes external placement irrational.`,
      tip: "Architecturally, you are locked by data volume. Consider repatriation or staying with your current primary data provider to avoid the egress tax."
    };
  }

  if (inputs.dutyCycle > 0.7) {
    return {
      verdict: "Steady-State Repatriation",
      reasoning: "High utilization (70%+) favors the fixed-cost CapEx model. Your amortized hardware cost is now significantly lower than cloud rental. Slide Duty Cycle below 70% to identify the cloud break-even point.",
      tip: "Leverage Nutanix Metro Availability on Cisco UCS to ensure Day 2 operational uptime matches cloud-native SLAs."
    };
  }

  return {
    verdict: "Hybrid Burst Eligible",
    reasoning: "Low gravity and variable duty cycle make specialized cloud providers the most efficient choice for high-intensity bursts. Cloud OpEx scales with your usage, avoiding idle hardware costs.",
    tip: "Use Infrastructure-as-Code (Terraform/Pulumi) to spin down these GPU clusters immediately after the inference or training batch completes."
  };
};