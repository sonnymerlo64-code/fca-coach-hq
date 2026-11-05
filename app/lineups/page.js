import AuthGate from '../AuthGate';
import Shell from '../Shell';import LineupFrame from './LineupFrame';export default function Page(){return <AuthGate><Shell><LineupFrame/></Shell></AuthGate>}