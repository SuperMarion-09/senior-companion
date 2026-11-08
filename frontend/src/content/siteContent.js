/*
  Text and lists shown on the public website, kept in one place so the
  homepage, booking form and status page always say the same thing.
  Edit the wording here, not inside the page components.
*/

export const BRAND = {
  name: 'Kaagapay',
  tagline: 'May kasama ka, may kaagapay ka.',
};

// TODO: Replace these placeholders with Kaagapay's real contact details.
export const CONTACT = {
  phone: '+63 900 000 0000',
  phoneHref: 'tel:+639000000000',
  email: 'hello@kaagapay.example',
  address: 'Office address to follow, Metro Manila, Philippines',
  hours: 'Monday to Saturday, 8:00 AM to 6:00 PM',
};

// `value` is what is sent to the backend; keep it stable once bookings exist.
export const SERVICES = [
  {
    value: 'errand',
    icon: 'clipboard',
    title: 'Errand Companion',
    description:
      'Paying bills, going to the bank, the post office or the barangay hall. Your companion goes along, helps with the queue and makes sure nothing is forgotten.',
  },
  {
    value: 'shopping',
    icon: 'shopping-bag',
    title: 'Shopping Assistance',
    description:
      'Trips to the palengke, grocery or mall. We help with the list, carry the bags and check the change, at a pace that suits your loved one.',
  },
  {
    value: 'walking',
    icon: 'footprints',
    title: 'Walking Companion',
    description:
      'A steady arm and good conversation for a morning walk in the park or around the neighbourhood, so they can stay active safely.',
  },
  {
    value: 'appointment',
    icon: 'calendar-check',
    title: 'Appointment Companion',
    description:
      'Accompaniment to check-ups, dental visits and other appointments. We help with registration, waiting and getting home, and take notes for the family.',
  },
  {
    value: 'social',
    icon: 'chat',
    title: 'Social Companion',
    description:
      'Merienda and kuwentuhan, a visit to church, a friend or a family event. Friendly company that brightens the day.',
  },
  {
    value: 'general',
    icon: 'hand-heart',
    title: 'General Non-Medical Assistance',
    description:
      'Help with everyday activities that do not need a nurse or caregiver, such as reading letters, using a phone or tidying up after an outing.',
  },
];

export const SERVICE_OPTIONS = SERVICES.map((service) => ({ value: service.value, label: service.title }));

export function serviceTitle(value) {
  return SERVICES.find((service) => service.value === value)?.title || value;
}

export const STEPS = [
  {
    title: 'Choose your service',
    description: 'Pick the kind of companionship your loved one needs.',
  },
  {
    title: 'Submit your booking request',
    description: 'Fill in the online form. It takes about five minutes.',
  },
  {
    title: 'Wait for administrator confirmation',
    description: 'Our team reviews the request, assigns a companion and contacts you.',
  },
  {
    title: 'Enjoy your scheduled service',
    description: 'Your companion arrives on time, ready to help with a smile.',
  },
];

export const REASONS = [
  {
    icon: 'smile',
    title: 'Friendly companionship',
    description: 'Warm, patient companions who treat your loved one like their own lolo or lola.',
  },
  {
    icon: 'shield',
    title: 'Respect and dignity',
    description: 'We follow their pace and their choices, and always ask before we help.',
  },
  {
    icon: 'hand-heart',
    title: 'Non-medical assistance',
    description: 'Clear about what we do: everyday help and company, never medical care.',
  },
  {
    icon: 'users',
    title: 'Family-focused communication',
    description: 'We keep the family informed before, during and after every booking.',
  },
  {
    icon: 'file-text',
    title: 'Clear booking policies',
    description: 'Simple rules on duration, cancellations and expenses, written in plain language.',
  },
  {
    icon: 'lock',
    title: 'Privacy and confidentiality',
    description: 'Personal and family matters stay private. Your details are used only for your booking.',
  },
];

// `id` is used for links, e.g. the footer's "Privacy policy" goes to #privacy.
export const GUIDELINES = [
  {
    id: 'non-medical',
    icon: 'hand-heart',
    title: 'Non-medical service limitations',
    points: [
      'Our companions do not give medicine, injections, wound care, therapy or any other medical or nursing care.',
      'They do not lift or transfer a person who needs special equipment or nursing support.',
      'Kaagapay does not replace a doctor, nurse or professional caregiver.',
    ],
  },
  {
    id: 'emergencies',
    icon: 'alert-triangle',
    title: 'Emergency procedures',
    points: [
      'In an emergency, the companion first calls the national emergency hotline 911.',
      'They then contact the emergency contact person and the Kaagapay office.',
      'The companion stays with your loved one until help or a family member arrives.',
    ],
  },
  {
    id: 'financial',
    icon: 'wallet',
    title: 'Financial guidelines',
    points: [
      'Companions never ask for or keep bank cards, PINs or passwords.',
      'Money for purchases is counted together, and receipts and change are always returned.',
      'Companions do not accept loans, cash gifts or tips. Transportation is billed separately.',
    ],
  },
  {
    id: 'privacy',
    icon: 'lock',
    title: 'Privacy policy',
    points: [
      'We collect only the details needed to arrange and carry out your booking.',
      'Your information is never sold or shared outside Kaagapay, except with emergency services when needed.',
      'Companions keep everything they see and hear during a visit confidential.',
    ],
  },
  {
    id: 'boundaries',
    icon: 'shield',
    title: 'Professional boundaries',
    points: [
      'All services are arranged through Kaagapay. Companions do not make private arrangements with clients.',
      'Companions do not post photos or stories about clients on social media.',
      'Companions are always courteous, punctual and respectful of your home and family.',
    ],
  },
];

export const BOOKING_POLICIES = [
  {
    icon: 'clock',
    title: 'Minimum of 3 hours',
    description: 'Every booking is for at least 3 hours, so there is never a rush.',
  },
  {
    icon: 'check-circle',
    title: 'Administrator confirmation',
    description: 'A booking is final only after our team confirms it with you.',
  },
  {
    icon: 'plus-circle',
    title: 'Extensions need approval',
    description: 'Need more time on the day? The companion checks with our office first.',
  },
  {
    icon: 'calendar',
    title: '12 to 24 hours’ notice to cancel',
    description: 'Please tell us at least 12 to 24 hours ahead if you need to cancel.',
  },
  {
    icon: 'car',
    title: 'Transportation billed separately',
    description: 'Fares, fuel and parking during the service are added to your bill.',
  },
];

export const FAQS = [
  {
    question: 'Who can use Kaagapay?',
    answer:
      'Senior citizens who are able to go out or receive visitors with some help and company. Bookings are usually made by a family member, but seniors can also book for themselves.',
  },
  {
    question: 'Are your companions nurses or caregivers?',
    answer:
      'No. Kaagapay provides non-medical companionship and assistance only. Our companions do not give medicine or medical care. If your loved one needs medical support, please arrange a nurse or caregiver.',
  },
  {
    question: 'How do I book a companion?',
    answer:
      'Click “Book a Companion”, fill in the form and submit it. You will receive a booking reference number. Our team will contact you to confirm the booking and the assigned companion.',
  },
  {
    question: 'Is my booking confirmed right away?',
    answer:
      'Not yet. Every booking starts as “Pending Confirmation”. It is confirmed only after an administrator reviews it and contacts you. You can check the status at any time with your reference number.',
  },
  {
    question: 'What is the shortest booking I can make?',
    answer: 'The minimum booking is 3 hours. If more time is needed on the day, the companion will ask our office to approve an extension.',
  },
  {
    question: 'How do I cancel or change a booking?',
    answer:
      'Please call or message us at least 12 to 24 hours before the start time. Have your booking reference number ready.',
  },
  {
    question: 'Who pays for transportation?',
    answer:
      'Transportation expenses during the service, such as fares, fuel or parking, are billed separately from the companionship fee.',
  },
  {
    question: 'What happens in an emergency?',
    answer:
      'The companion calls 911 first, then the emergency contact you gave us and the Kaagapay office, and stays with your loved one until help or family arrives.',
  },
  {
    question: 'How do you protect our privacy?',
    answer:
      'We only collect what is needed for the booking and never share it outside Kaagapay, except with emergency services when necessary. When you check a booking online, we ask for both the reference number and the contact number, so no one else can see your details.',
  },
];

// What each booking status means, in plain words for families.
export const BOOKING_STATUSES = {
  pending: {
    label: 'Pending Confirmation',
    tone: 'warning',
    description: 'We have received your request. An administrator will review it and contact you to confirm.',
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'success',
    description: 'Your booking is confirmed. Your companion will arrive at the agreed time and place.',
  },
  completed: {
    label: 'Completed',
    tone: 'info',
    description: 'This service has been completed. Thank you for choosing Kaagapay.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'error',
    description: 'This booking has been cancelled. Contact us if you would like to book again.',
  },
  // Admins see "Rejected"; families see this gentler wording.
  rejected: {
    label: 'Not Available',
    tone: 'error',
    description: 'We are sorry, we could not arrange a companion for this request. Please contact us for other dates.',
  },
};
