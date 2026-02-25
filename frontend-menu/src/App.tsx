import Layout from './components/layout/Layout';
import MenuPage from './components/menu/MenuPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1a1a2e',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
      <Layout>
        <MenuPage />
      </Layout>
    </>
  );
}

export default App;
