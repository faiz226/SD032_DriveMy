// The simulator's data files. docs/ holds the single source of truth; the app imports it as is.
import type { CarConfig, CircuitData, RulesData } from './contracts';
import circuitJson from '../../docs/circuit-v2/circuit.json';
import rulesJson from '../../docs/v2-plan/rules.json';
import carJson from '../../docs/circuit-v2/car-swift-2022.json';

export const circuit = circuitJson as unknown as CircuitData;
export const rules = rulesJson as unknown as RulesData;
export const swift = carJson as CarConfig;
