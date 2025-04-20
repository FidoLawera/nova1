import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WaitingModalProps {
  isOpen: boolean;
  message: string;
}

const WaitingModal = ({ isOpen, message }: WaitingModalProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-ui-blue rounded-lg shadow-lg max-w-md w-full p-6 mx-4 text-center">
        <AlertDialogHeader>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold mx-auto mb-4"></div>
          <AlertDialogTitle className="text-xl font-poppins font-medium text-light mb-2">
            {message}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-medium mb-4">Please wait while we set up your game</div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WaitingModal;
