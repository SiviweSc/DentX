import { BookingFormNew } from "./booking-form-new";

interface BookingFormProps {
  onClose: () => void;
}

export function BookingForm({ onClose }: BookingFormProps) {
  return <BookingFormNew onClose={onClose} />;
}
