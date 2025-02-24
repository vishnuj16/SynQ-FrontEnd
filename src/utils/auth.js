import { jwtDecode } from "jwt-decode";

export function isTokenValid(token) {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Current time in seconds
    return decoded.exp > currentTime; // Token is valid if its expiration time is in the future
  } catch (error) {
    console.error("Invalid token:", error);
    return false; // Invalid token
  }
}
