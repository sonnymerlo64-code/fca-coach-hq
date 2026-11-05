import AuthGate from '../AuthGate';import Shell from '../Shell';import CoachFrame from '../CoachFrame';
export default function Page(){return <AuthGate>{session=><Shell><CoachFrame kind="lineups" session={session}/></Shell>}</AuthGate>}
