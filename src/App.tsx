import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';


function App() {
  return (
    <BrowserRouter>
      {/* GlobalStyles is rendered in main.tsx, but can also be here if we want it inside Router context or similar. 
          Currently main.tsx handles it. */}
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
