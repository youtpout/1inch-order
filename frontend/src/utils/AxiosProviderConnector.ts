
import { AuthError } from "@1inch/limit-order-sdk";
import axios, { isAxiosError } from "axios";

export class CustomAxiosProviderConnector {
    async get(url: string, headers: any) {
        try {
            const res = await axios.get(url, {
                headers
            });
            return res.data;
        }
        catch (error) {
            if (isAxiosError(error)) {
                console.error('Error Axios :', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            }
            if (isAxiosError(error) && error.response?.status === 401) {
                throw new AuthError();
            }
            throw error;
        }
    }
    async post(url: string, data: any, headers: any) {
        try {
            const res = await axios.post(url, data, {
                headers
            });
            return res.data;
        }
        catch (error) {
            console.log("error", error);
            if (isAxiosError(error)) {
                console.error('Error Axios :', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            }
            if (isAxiosError(error) && error.response?.status === 401) {
                throw new AuthError();
            }
            throw error;
        }
    }
}
