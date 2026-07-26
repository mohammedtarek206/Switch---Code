import { redirect } from 'next/navigation';

export default function EventsIndexPage() {
    // Redirect to the home page which already has the Upcoming Events section
    redirect('/#events');
}
