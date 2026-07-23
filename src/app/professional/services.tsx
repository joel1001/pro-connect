import { Redirect } from 'expo-router';

export default function ProfessionalServicesRedirect() {
  return <Redirect href={{ pathname: '/shared/settings', params: { section: 'services', focus: 'services' } }} />;
}
