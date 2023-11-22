import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/solid";

type PersonalInfoProps = {
  name: string;
  phone: string;
  email: string;
};

export default function PersonalInfo({
  name,
  phone,
  email,
}: PersonalInfoProps) {
  return (
    <div>
      <h1 className="text-3xl">{name}</h1>
      <div className="flex">
        <PhoneIcon className="w-4 mr-2" />
        {phone}
      </div>
      <div className="flex">
        <EnvelopeIcon className="w-4 mr-2" />
        {/* <TextToImage text={email} /> */} {email}
      </div>
    </div>
  );
}
