/**
 * Countries utility - provides a comprehensive list of all countries
 * with Schengen status and flag emojis
 */

import { Country } from '../types';

/**
 * Complete list of all countries in the world with Schengen status and flag emoji
 */
const ALL_COUNTRIES: Country[] = [
  // Schengen Countries
  { id: 'AT', name: 'Austria', code: 'AT', isSchengen: true, flagEmoji: '🇦🇹' },
  { id: 'BE', name: 'Belgium', code: 'BE', isSchengen: true, flagEmoji: '🇧🇪' },
  { id: 'HR', name: 'Croatia', code: 'HR', isSchengen: true, flagEmoji: '🇭🇷' },
  { id: 'CZ', name: 'Czech Republic', code: 'CZ', isSchengen: true, flagEmoji: '🇨🇿' },
  { id: 'DK', name: 'Denmark', code: 'DK', isSchengen: true, flagEmoji: '🇩🇰' },
  { id: 'EE', name: 'Estonia', code: 'EE', isSchengen: true, flagEmoji: '🇪🇪' },
  { id: 'FI', name: 'Finland', code: 'FI', isSchengen: true, flagEmoji: '🇫🇮' },
  { id: 'FR', name: 'France', code: 'FR', isSchengen: true, flagEmoji: '🇫🇷' },
  { id: 'DE', name: 'Germany', code: 'DE', isSchengen: true, flagEmoji: '🇩🇪' },
  { id: 'GR', name: 'Greece', code: 'GR', isSchengen: true, flagEmoji: '🇬🇷' },
  { id: 'HU', name: 'Hungary', code: 'HU', isSchengen: true, flagEmoji: '🇭🇺' },
  { id: 'IS', name: 'Iceland', code: 'IS', isSchengen: true, flagEmoji: '🇮🇸' },
  { id: 'IT', name: 'Italy', code: 'IT', isSchengen: true, flagEmoji: '🇮🇹' },
  { id: 'LV', name: 'Latvia', code: 'LV', isSchengen: true, flagEmoji: '🇱🇻' },
  { id: 'LI', name: 'Liechtenstein', code: 'LI', isSchengen: true, flagEmoji: '🇱🇮' },
  { id: 'LT', name: 'Lithuania', code: 'LT', isSchengen: true, flagEmoji: '🇱🇹' },
  { id: 'LU', name: 'Luxembourg', code: 'LU', isSchengen: true, flagEmoji: '🇱🇺' },
  { id: 'MT', name: 'Malta', code: 'MT', isSchengen: true, flagEmoji: '🇲🇹' },
  { id: 'NL', name: 'Netherlands', code: 'NL', isSchengen: true, flagEmoji: '🇳🇱' },
  { id: 'NO', name: 'Norway', code: 'NO', isSchengen: true, flagEmoji: '🇳🇴' },
  { id: 'PL', name: 'Poland', code: 'PL', isSchengen: true, flagEmoji: '🇵🇱' },
  { id: 'PT', name: 'Portugal', code: 'PT', isSchengen: true, flagEmoji: '🇵🇹' },
  { id: 'SK', name: 'Slovakia', code: 'SK', isSchengen: true, flagEmoji: '🇸🇰' },
  { id: 'SI', name: 'Slovenia', code: 'SI', isSchengen: true, flagEmoji: '🇸🇮' },
  { id: 'ES', name: 'Spain', code: 'ES', isSchengen: true, flagEmoji: '🇪🇸' },
  { id: 'SE', name: 'Sweden', code: 'SE', isSchengen: true, flagEmoji: '🇸🇪' },
  { id: 'CH', name: 'Switzerland', code: 'CH', isSchengen: true, flagEmoji: '🇨🇭' },

  // Non-Schengen Countries (alphabetically)
  { id: 'AF', name: 'Afghanistan', code: 'AF', isSchengen: false, flagEmoji: '🇦🇫' },
  { id: 'AL', name: 'Albania', code: 'AL', isSchengen: false, flagEmoji: '🇦🇱' },
  { id: 'DZ', name: 'Algeria', code: 'DZ', isSchengen: false, flagEmoji: '🇩🇿' },
  { id: 'AD', name: 'Andorra', code: 'AD', isSchengen: false, flagEmoji: '🇦🇩' },
  { id: 'AO', name: 'Angola', code: 'AO', isSchengen: false, flagEmoji: '🇦🇴' },
  { id: 'AG', name: 'Antigua and Barbuda', code: 'AG', isSchengen: false, flagEmoji: '🇦🇬' },
  { id: 'AR', name: 'Argentina', code: 'AR', isSchengen: false, flagEmoji: '🇦🇷' },
  { id: 'AM', name: 'Armenia', code: 'AM', isSchengen: false, flagEmoji: '🇦🇲' },
  { id: 'AU', name: 'Australia', code: 'AU', isSchengen: false, flagEmoji: '🇦🇺' },
  { id: 'AZ', name: 'Azerbaijan', code: 'AZ', isSchengen: false, flagEmoji: '🇦🇿' },
  { id: 'BS', name: 'Bahamas', code: 'BS', isSchengen: false, flagEmoji: '🇧🇸' },
  { id: 'BH', name: 'Bahrain', code: 'BH', isSchengen: false, flagEmoji: '🇧🇭' },
  { id: 'BD', name: 'Bangladesh', code: 'BD', isSchengen: false, flagEmoji: '🇧🇩' },
  { id: 'BB', name: 'Barbados', code: 'BB', isSchengen: false, flagEmoji: '🇧🇧' },
  { id: 'BY', name: 'Belarus', code: 'BY', isSchengen: false, flagEmoji: '🇧🇾' },
  { id: 'BZ', name: 'Belize', code: 'BZ', isSchengen: false, flagEmoji: '🇧🇿' },
  { id: 'BJ', name: 'Benin', code: 'BJ', isSchengen: false, flagEmoji: '🇧🇯' },
  { id: 'BT', name: 'Bhutan', code: 'BT', isSchengen: false, flagEmoji: '🇧🇹' },
  { id: 'BO', name: 'Bolivia', code: 'BO', isSchengen: false, flagEmoji: '🇧🇴' },
  { id: 'BA', name: 'Bosnia and Herzegovina', code: 'BA', isSchengen: false, flagEmoji: '🇧🇦' },
  { id: 'BW', name: 'Botswana', code: 'BW', isSchengen: false, flagEmoji: '🇧🇼' },
  { id: 'BR', name: 'Brazil', code: 'BR', isSchengen: false, flagEmoji: '🇧🇷' },
  { id: 'BN', name: 'Brunei', code: 'BN', isSchengen: false, flagEmoji: '🇧🇳' },
  { id: 'BG', name: 'Bulgaria', code: 'BG', isSchengen: false, flagEmoji: '🇧🇬' },
  { id: 'BF', name: 'Burkina Faso', code: 'BF', isSchengen: false, flagEmoji: '🇧🇫' },
  { id: 'BI', name: 'Burundi', code: 'BI', isSchengen: false, flagEmoji: '🇧🇮' },
  { id: 'CV', name: 'Cabo Verde', code: 'CV', isSchengen: false, flagEmoji: '🇨🇻' },
  { id: 'KH', name: 'Cambodia', code: 'KH', isSchengen: false, flagEmoji: '🇰🇭' },
  { id: 'CM', name: 'Cameroon', code: 'CM', isSchengen: false, flagEmoji: '🇨🇲' },
  { id: 'CA', name: 'Canada', code: 'CA', isSchengen: false, flagEmoji: '🇨🇦' },
  { id: 'CF', name: 'Central African Republic', code: 'CF', isSchengen: false, flagEmoji: '🇨🇫' },
  { id: 'TD', name: 'Chad', code: 'TD', isSchengen: false, flagEmoji: '🇹🇩' },
  { id: 'CL', name: 'Chile', code: 'CL', isSchengen: false, flagEmoji: '🇨🇱' },
  { id: 'CN', name: 'China', code: 'CN', isSchengen: false, flagEmoji: '🇨🇳' },
  { id: 'CO', name: 'Colombia', code: 'CO', isSchengen: false, flagEmoji: '🇨🇴' },
  { id: 'KM', name: 'Comoros', code: 'KM', isSchengen: false, flagEmoji: '🇰🇲' },
  { id: 'CG', name: 'Congo', code: 'CG', isSchengen: false, flagEmoji: '🇨🇬' },
  { id: 'CD', name: 'Congo (Democratic Republic)', code: 'CD', isSchengen: false, flagEmoji: '🇨🇩' },
  { id: 'CR', name: 'Costa Rica', code: 'CR', isSchengen: false, flagEmoji: '🇨🇷' },
  { id: 'CI', name: 'Côte d\'Ivoire', code: 'CI', isSchengen: false, flagEmoji: '🇨🇮' },
  { id: 'CU', name: 'Cuba', code: 'CU', isSchengen: false, flagEmoji: '🇨🇺' },
  { id: 'CY', name: 'Cyprus', code: 'CY', isSchengen: false, flagEmoji: '🇨🇾' },
  { id: 'DJ', name: 'Djibouti', code: 'DJ', isSchengen: false, flagEmoji: '🇩🇯' },
  { id: 'DM', name: 'Dominica', code: 'DM', isSchengen: false, flagEmoji: '🇩🇲' },
  { id: 'DO', name: 'Dominican Republic', code: 'DO', isSchengen: false, flagEmoji: '🇩🇴' },
  { id: 'EC', name: 'Ecuador', code: 'EC', isSchengen: false, flagEmoji: '🇪🇨' },
  { id: 'EG', name: 'Egypt', code: 'EG', isSchengen: false, flagEmoji: '🇪🇬' },
  { id: 'SV', name: 'El Salvador', code: 'SV', isSchengen: false, flagEmoji: '🇸🇻' },
  { id: 'GQ', name: 'Equatorial Guinea', code: 'GQ', isSchengen: false, flagEmoji: '🇬🇶' },
  { id: 'ER', name: 'Eritrea', code: 'ER', isSchengen: false, flagEmoji: '🇪🇷' },
  { id: 'ET', name: 'Ethiopia', code: 'ET', isSchengen: false, flagEmoji: '🇪🇹' },
  { id: 'FJ', name: 'Fiji', code: 'FJ', isSchengen: false, flagEmoji: '🇫🇯' },
  { id: 'GA', name: 'Gabon', code: 'GA', isSchengen: false, flagEmoji: '🇬🇦' },
  { id: 'GM', name: 'Gambia', code: 'GM', isSchengen: false, flagEmoji: '🇬🇲' },
  { id: 'GE', name: 'Georgia', code: 'GE', isSchengen: false, flagEmoji: '🇬🇪' },
  { id: 'GH', name: 'Ghana', code: 'GH', isSchengen: false, flagEmoji: '🇬🇭' },
  { id: 'GD', name: 'Grenada', code: 'GD', isSchengen: false, flagEmoji: '🇬🇩' },
  { id: 'GT', name: 'Guatemala', code: 'GT', isSchengen: false, flagEmoji: '🇬🇹' },
  { id: 'GN', name: 'Guinea', code: 'GN', isSchengen: false, flagEmoji: '🇬🇳' },
  { id: 'GW', name: 'Guinea-Bissau', code: 'GW', isSchengen: false, flagEmoji: '🇬🇼' },
  { id: 'GY', name: 'Guyana', code: 'GY', isSchengen: false, flagEmoji: '🇬🇾' },
  { id: 'HT', name: 'Haiti', code: 'HT', isSchengen: false, flagEmoji: '🇭🇹' },
  { id: 'HN', name: 'Honduras', code: 'HN', isSchengen: false, flagEmoji: '🇭🇳' },
  { id: 'IN', name: 'India', code: 'IN', isSchengen: false, flagEmoji: '🇮🇳' },
  { id: 'ID', name: 'Indonesia', code: 'ID', isSchengen: false, flagEmoji: '🇮🇩' },
  { id: 'IR', name: 'Iran', code: 'IR', isSchengen: false, flagEmoji: '🇮🇷' },
  { id: 'IQ', name: 'Iraq', code: 'IQ', isSchengen: false, flagEmoji: '🇮🇶' },
  { id: 'IE', name: 'Ireland', code: 'IE', isSchengen: false, flagEmoji: '🇮🇪' },
  { id: 'IL', name: 'Israel', code: 'IL', isSchengen: false, flagEmoji: '🇮🇱' },
  { id: 'JM', name: 'Jamaica', code: 'JM', isSchengen: false, flagEmoji: '🇯🇲' },
  { id: 'JP', name: 'Japan', code: 'JP', isSchengen: false, flagEmoji: '🇯🇵' },
  { id: 'JO', name: 'Jordan', code: 'JO', isSchengen: false, flagEmoji: '🇯🇴' },
  { id: 'KZ', name: 'Kazakhstan', code: 'KZ', isSchengen: false, flagEmoji: '🇰🇿' },
  { id: 'KE', name: 'Kenya', code: 'KE', isSchengen: false, flagEmoji: '🇰🇪' },
  { id: 'KI', name: 'Kiribati', code: 'KI', isSchengen: false, flagEmoji: '🇰🇮' },
  { id: 'KP', name: 'North Korea', code: 'KP', isSchengen: false, flagEmoji: '🇰🇵' },
  { id: 'KR', name: 'South Korea', code: 'KR', isSchengen: false, flagEmoji: '🇰🇷' },
  { id: 'KW', name: 'Kuwait', code: 'KW', isSchengen: false, flagEmoji: '🇰🇼' },
  { id: 'KG', name: 'Kyrgyzstan', code: 'KG', isSchengen: false, flagEmoji: '🇰🇬' },
  { id: 'LA', name: 'Laos', code: 'LA', isSchengen: false, flagEmoji: '🇱🇦' },
  { id: 'LB', name: 'Lebanon', code: 'LB', isSchengen: false, flagEmoji: '🇱🇧' },
  { id: 'LS', name: 'Lesotho', code: 'LS', isSchengen: false, flagEmoji: '🇱🇸' },
  { id: 'LR', name: 'Liberia', code: 'LR', isSchengen: false, flagEmoji: '🇱🇷' },
  { id: 'LY', name: 'Libya', code: 'LY', isSchengen: false, flagEmoji: '🇱🇾' },
  { id: 'MK', name: 'North Macedonia', code: 'MK', isSchengen: false, flagEmoji: '🇲🇰' },
  { id: 'MG', name: 'Madagascar', code: 'MG', isSchengen: false, flagEmoji: '🇲🇬' },
  { id: 'MW', name: 'Malawi', code: 'MW', isSchengen: false, flagEmoji: '🇲🇼' },
  { id: 'MY', name: 'Malaysia', code: 'MY', isSchengen: false, flagEmoji: '🇲🇾' },
  { id: 'MV', name: 'Maldives', code: 'MV', isSchengen: false, flagEmoji: '🇲🇻' },
  { id: 'ML', name: 'Mali', code: 'ML', isSchengen: false, flagEmoji: '🇲🇱' },
  { id: 'MH', name: 'Marshall Islands', code: 'MH', isSchengen: false, flagEmoji: '🇲🇭' },
  { id: 'MR', name: 'Mauritania', code: 'MR', isSchengen: false, flagEmoji: '🇲🇷' },
  { id: 'MU', name: 'Mauritius', code: 'MU', isSchengen: false, flagEmoji: '🇲🇺' },
  { id: 'MX', name: 'Mexico', code: 'MX', isSchengen: false, flagEmoji: '🇲🇽' },
  { id: 'FM', name: 'Micronesia', code: 'FM', isSchengen: false, flagEmoji: '🇫🇲' },
  { id: 'MD', name: 'Moldova', code: 'MD', isSchengen: false, flagEmoji: '🇲🇩' },
  { id: 'MC', name: 'Monaco', code: 'MC', isSchengen: false, flagEmoji: '🇲🇨' },
  { id: 'MN', name: 'Mongolia', code: 'MN', isSchengen: false, flagEmoji: '🇲🇳' },
  { id: 'ME', name: 'Montenegro', code: 'ME', isSchengen: false, flagEmoji: '🇲🇪' },
  { id: 'MA', name: 'Morocco', code: 'MA', isSchengen: false, flagEmoji: '🇲🇦' },
  { id: 'MZ', name: 'Mozambique', code: 'MZ', isSchengen: false, flagEmoji: '🇲🇿' },
  { id: 'MM', name: 'Myanmar', code: 'MM', isSchengen: false, flagEmoji: '🇲🇲' },
  { id: 'NA', name: 'Namibia', code: 'NA', isSchengen: false, flagEmoji: '🇳🇦' },
  { id: 'NR', name: 'Nauru', code: 'NR', isSchengen: false, flagEmoji: '🇳🇷' },
  { id: 'NP', name: 'Nepal', code: 'NP', isSchengen: false, flagEmoji: '🇳🇵' },
  { id: 'NZ', name: 'New Zealand', code: 'NZ', isSchengen: false, flagEmoji: '🇳🇿' },
  { id: 'NI', name: 'Nicaragua', code: 'NI', isSchengen: false, flagEmoji: '🇳🇮' },
  { id: 'NE', name: 'Niger', code: 'NE', isSchengen: false, flagEmoji: '🇳🇪' },
  { id: 'NG', name: 'Nigeria', code: 'NG', isSchengen: false, flagEmoji: '🇳🇬' },
  { id: 'OM', name: 'Oman', code: 'OM', isSchengen: false, flagEmoji: '🇴🇲' },
  { id: 'PK', name: 'Pakistan', code: 'PK', isSchengen: false, flagEmoji: '🇵🇰' },
  { id: 'PW', name: 'Palau', code: 'PW', isSchengen: false, flagEmoji: '🇵🇼' },
  { id: 'PS', name: 'Palestine', code: 'PS', isSchengen: false, flagEmoji: '🇵🇸' },
  { id: 'PA', name: 'Panama', code: 'PA', isSchengen: false, flagEmoji: '🇵🇦' },
  { id: 'PG', name: 'Papua New Guinea', code: 'PG', isSchengen: false, flagEmoji: '🇵🇬' },
  { id: 'PY', name: 'Paraguay', code: 'PY', isSchengen: false, flagEmoji: '🇵🇾' },
  { id: 'PE', name: 'Peru', code: 'PE', isSchengen: false, flagEmoji: '🇵🇪' },
  { id: 'PH', name: 'Philippines', code: 'PH', isSchengen: false, flagEmoji: '🇵🇭' },
  { id: 'QA', name: 'Qatar', code: 'QA', isSchengen: false, flagEmoji: '🇶🇦' },
  { id: 'RO', name: 'Romania', code: 'RO', isSchengen: false, flagEmoji: '🇷🇴' },
  { id: 'RU', name: 'Russia', code: 'RU', isSchengen: false, flagEmoji: '🇷🇺' },
  { id: 'RW', name: 'Rwanda', code: 'RW', isSchengen: false, flagEmoji: '🇷🇼' },
  { id: 'KN', name: 'Saint Kitts and Nevis', code: 'KN', isSchengen: false, flagEmoji: '🇰🇳' },
  { id: 'LC', name: 'Saint Lucia', code: 'LC', isSchengen: false, flagEmoji: '🇱🇨' },
  { id: 'VC', name: 'Saint Vincent and the Grenadines', code: 'VC', isSchengen: false, flagEmoji: '🇻🇨' },
  { id: 'WS', name: 'Samoa', code: 'WS', isSchengen: false, flagEmoji: '🇼🇸' },
  { id: 'SM', name: 'San Marino', code: 'SM', isSchengen: false, flagEmoji: '🇸🇲' },
  { id: 'ST', name: 'Sao Tome and Principe', code: 'ST', isSchengen: false, flagEmoji: '🇸🇹' },
  { id: 'SA', name: 'Saudi Arabia', code: 'SA', isSchengen: false, flagEmoji: '🇸🇦' },
  { id: 'SN', name: 'Senegal', code: 'SN', isSchengen: false, flagEmoji: '🇸🇳' },
  { id: 'RS', name: 'Serbia', code: 'RS', isSchengen: false, flagEmoji: '🇷🇸' },
  { id: 'SC', name: 'Seychelles', code: 'SC', isSchengen: false, flagEmoji: '🇸🇨' },
  { id: 'SL', name: 'Sierra Leone', code: 'SL', isSchengen: false, flagEmoji: '🇸🇱' },
  { id: 'SG', name: 'Singapore', code: 'SG', isSchengen: false, flagEmoji: '🇸🇬' },
  { id: 'SB', name: 'Solomon Islands', code: 'SB', isSchengen: false, flagEmoji: '🇸🇧' },
  { id: 'SO', name: 'Somalia', code: 'SO', isSchengen: false, flagEmoji: '🇸🇴' },
  { id: 'ZA', name: 'South Africa', code: 'ZA', isSchengen: false, flagEmoji: '🇿🇦' },
  { id: 'SS', name: 'South Sudan', code: 'SS', isSchengen: false, flagEmoji: '🇸🇸' },
  { id: 'LK', name: 'Sri Lanka', code: 'LK', isSchengen: false, flagEmoji: '🇱🇰' },
  { id: 'SD', name: 'Sudan', code: 'SD', isSchengen: false, flagEmoji: '🇸🇩' },
  { id: 'SR', name: 'Suriname', code: 'SR', isSchengen: false, flagEmoji: '🇸🇷' },
  { id: 'SZ', name: 'Eswatini', code: 'SZ', isSchengen: false, flagEmoji: '🇸🇿' },
  { id: 'SY', name: 'Syria', code: 'SY', isSchengen: false, flagEmoji: '🇸🇾' },
  { id: 'TW', name: 'Taiwan', code: 'TW', isSchengen: false, flagEmoji: '🇹🇼' },
  { id: 'TJ', name: 'Tajikistan', code: 'TJ', isSchengen: false, flagEmoji: '🇹🇯' },
  { id: 'TZ', name: 'Tanzania', code: 'TZ', isSchengen: false, flagEmoji: '🇹🇿' },
  { id: 'TH', name: 'Thailand', code: 'TH', isSchengen: false, flagEmoji: '🇹🇭' },
  { id: 'TL', name: 'Timor-Leste', code: 'TL', isSchengen: false, flagEmoji: '🇹🇱' },
  { id: 'TG', name: 'Togo', code: 'TG', isSchengen: false, flagEmoji: '🇹🇬' },
  { id: 'TO', name: 'Tonga', code: 'TO', isSchengen: false, flagEmoji: '🇹🇴' },
  { id: 'TT', name: 'Trinidad and Tobago', code: 'TT', isSchengen: false, flagEmoji: '🇹🇹' },
  { id: 'TN', name: 'Tunisia', code: 'TN', isSchengen: false, flagEmoji: '🇹🇳' },
  { id: 'TR', name: 'Turkey', code: 'TR', isSchengen: false, flagEmoji: '🇹🇷' },
  { id: 'TM', name: 'Turkmenistan', code: 'TM', isSchengen: false, flagEmoji: '🇹🇲' },
  { id: 'TV', name: 'Tuvalu', code: 'TV', isSchengen: false, flagEmoji: '🇹🇻' },
  { id: 'UG', name: 'Uganda', code: 'UG', isSchengen: false, flagEmoji: '🇺🇬' },
  { id: 'UA', name: 'Ukraine', code: 'UA', isSchengen: false, flagEmoji: '🇺🇦' },
  { id: 'AE', name: 'United Arab Emirates', code: 'AE', isSchengen: false, flagEmoji: '🇦🇪' },
  { id: 'GB', name: 'United Kingdom', shortName: "UK", code: 'GB', isSchengen: false, flagEmoji: '🇬🇧' },
  { id: 'US', name: 'United States', code: 'US', isSchengen: false, flagEmoji: '🇺🇸' },
  { id: 'UY', name: 'Uruguay', code: 'UY', isSchengen: false, flagEmoji: '🇺🇾' },
  { id: 'UZ', name: 'Uzbekistan', code: 'UZ', isSchengen: false, flagEmoji: '🇺🇿' },
  { id: 'VU', name: 'Vanuatu', code: 'VU', isSchengen: false, flagEmoji: '🇻🇺' },
  { id: 'VA', name: 'Vatican City', code: 'VA', isSchengen: false, flagEmoji: '🇻🇦' },
  { id: 'VE', name: 'Venezuela', code: 'VE', isSchengen: false, flagEmoji: '🇻🇪' },
  { id: 'VN', name: 'Vietnam', code: 'VN', isSchengen: false, flagEmoji: '🇻🇳' },
  { id: 'YE', name: 'Yemen', code: 'YE', isSchengen: false, flagEmoji: '🇾🇪' },
  { id: 'ZM', name: 'Zambia', code: 'ZM', isSchengen: false, flagEmoji: '🇿🇲' },
  { id: 'ZW', name: 'Zimbabwe', code: 'ZW', isSchengen: false, flagEmoji: '🇿🇼' },
];

/**
 * Returns a complete list of all countries with their Schengen status and flag emoji
 */
export function getAllCountries(): Country[] {
  return [...ALL_COUNTRIES];
}

/**
 * Get a country by its ID
 */
export function getCountryById(id: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.id === id);
}

/**
 * Get a country by its name (case-insensitive)
 */
export function getCountryByName(name: string): Country | undefined {
  const lowerName = name.toLowerCase();
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === lowerName);
}

/**
 * Get all Schengen countries
 */
export function getSchengenCountries(): Country[] {
  return ALL_COUNTRIES.filter(c => c.isSchengen === true);
}

/**
 * Get all non-Schengen countries
 */
export function getNonSchengenCountries(): Country[] {
  return ALL_COUNTRIES.filter(c => c.isSchengen === false);
}

/**
 * Update a country's properties
 * @param id - The country ID to update
 * @param updates - Partial country object with fields to update
 * @returns The updated country or undefined if not found
 */
export function updateCountry(
  id: string,
  updates: Partial<Omit<Country, 'id'>>
): Country | undefined {
  const index = ALL_COUNTRIES.findIndex(c => c.id === id);
  
  if (index === -1) {
    return undefined;
  }

  ALL_COUNTRIES[index] = {
    ...ALL_COUNTRIES[index],
    ...updates,
    id, // Ensure ID cannot be changed
  };

  return ALL_COUNTRIES[index];
}
