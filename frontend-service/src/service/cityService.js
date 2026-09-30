import { ADDRESS_API } from '../config';
import axios from 'axios';
export const addCity = (countryId, stateId, city) => {
    return axios.post(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city`, city);
}

export const deleteCity = (countryId, stateId, cityId) => {
    return axios.delete(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city/${cityId}`);
}

export const getAllCities = (countryId, stateId) => {
    return axios.get(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city`);
}