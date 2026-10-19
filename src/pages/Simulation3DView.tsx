// The simulator route (/simulations/:id), behind the protected app routes. It is DriveMy v2's simulator:
// /simulations/assessment opens the assessment, and /simulations/<station id> opens practice on that station.
// The v1 page and its manual pass button are gone; a run's verdict now comes only from the rules.
export { SimulatorPage as Simulation3DView } from "@/sim/ui/SimulatorPage";
