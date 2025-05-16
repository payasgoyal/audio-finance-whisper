
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6152f9] to-[#3e30b7] flex flex-col items-center justify-center p-4 text-white">
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Button 
        onClick={() => navigate("/")}
        className="bg-white text-[#6152f9] hover:bg-white/90"
      >
        Return to Home
      </Button>
    </div>
  );
};

export default NotFound;
