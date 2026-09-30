import { ADDRESS_API } from '../config';
import axios from 'axios';
export const addCountry = (country) => {
    return axios.post(ADDRESS_API + '/api/v1/country', country);
}

export const deleteCountry = (countryId) => {
    return axios.delete(`${ADDRESS_API}/api/v1/country/${countryId}`)
}

export const getAllCountries = () => {
    return axios.get(ADDRESS_API + '/api/v1/country');
}