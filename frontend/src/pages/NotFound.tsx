import { useNavigate } from 'react-router-dom';
import { Button, Logo } from '../components/ui';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm animate-in text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText={false} />
        </div>

        <h1 className="text-7xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 mb-8">
          Page not found
        </p>

        <Button onClick={() => navigate('/')} className="w-full">
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
