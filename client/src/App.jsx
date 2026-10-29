import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { UIProvider, useUI } from './context/UIContext.jsx';
import { TaskProvider } from './context/TaskContext.jsx';
import SlideSwitcher from './components/motion/SlideSwitcher.jsx';
import MorphLoader from './components/motion/MorphLoader.jsx';
import TopBar from './components/layout/TopBar.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Notifications from './components/layout/Notifications.jsx';
import ModalHost from './components/modals/ModalHost.jsx';
import EmptyState from './components/ui/EmptyState.jsx';
import { Button } from './components/ui/Button.jsx';
import SignInScreen from './screens/SignInScreen.jsx';
import TodayScreen from './screens/TodayScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import PublicScreen from './screens/PublicScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import useHashTab from './hooks/useHashTab.js';
import useReminders from './hooks/useReminders.js';
import useTaskActions from './hooks/useTaskActions.js';
import { registerServiceWorker } from './lib/push.js';

function AppShell() {
  const { user } = useApp();
  const { openModal } = useUI();
  const { tab, direction, navigate } = useHashTab();
  const { newTask } = useTaskActions();
  const askedOnboarding = useRef(false);
  useReminders();

  // First sign-in: ask how reminders should work.
  useEffect(() => {
    if (!user.onboarded && !askedOnboarding.current) {
      askedOnboarding.current = true;
      openModal('onboarding', {});
    }
  }, [user.onboarded, openModal]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const screens = {
    today: <TodayScreen onNavigate={navigate} />,
    calendar: <CalendarScreen />,
    public: <PublicScreen />,
    settings: <SettingsScreen />,
  };

  return (
    <div className="shell">
      <TopBar tab={tab} onNavigate={navigate} onNewTask={() => newTask()} />
      <main className="shell__main" id="main">
        <SlideSwitcher id={tab} direction={direction}>
          {screens[tab]}
        </SlideSwitcher>
      </main>
      <BottomNav tab={tab} onNavigate={navigate} />
    </div>
  );
}

function BootError() {
  const { bootError, boot } = useApp();
  return (
    <div className="center-screen">
      <div className="center-screen__box">
        <EmptyState title="TaskWise could not start" message={`${bootError?.message || ''} ${bootError?.hint || ''}`} />
        <Button variant="primary" onClick={boot}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function Root() {
  const { status } = useApp();

  // The static loader in index.html hands over to React's identical loader.
  useEffect(() => {
    document.getElementById('boot')?.remove();
  }, []);

  let screen;
  if (status === 'loading') screen = <MorphLoader size="lg" label="Loading TaskWise" />;
  else if (status === 'error') screen = <BootError />;
  else if (status === 'signedOut') screen = <SignInScreen />;
  else screen = <AppShell />;

  return (
    <>
      <SlideSwitcher id={status} mode="fade" className="root-switch">
        {screen}
      </SlideSwitcher>
      <ModalHost />
      <Notifications />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <UIProvider>
        <TaskProvider>
          <Root />
        </TaskProvider>
      </UIProvider>
    </AppProvider>
  );
}
