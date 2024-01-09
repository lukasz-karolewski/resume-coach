import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/solid";

type ContactInfoProps = {
  name: string;
  phone: string;
  email: string;
};

export default function ContactInfo({ name, phone, email }: ContactInfoProps) {
  return (
    <div>
      <h1 className="text-3xl">{name}</h1>
      <div className="flex">
        <PhoneIcon className="mr-2 w-4" />
        {phone}
      </div>
      <div className="flex">
        <EnvelopeIcon className="mr-2 w-4" />
        {/* <TextToImage text={email} /> */} {email}
      </div>
    </div>
  );
}
