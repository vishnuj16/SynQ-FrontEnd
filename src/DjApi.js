import axios from 'axios';

const AUTH_BASE_URl = 'http://localhost:8000/api/auth';
const CHAT_BASE_URl = 'http://localhost:8000/api/chat';


function getCookie(name) {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1];
    return cookieValue || '';
}
  

export const loginUser = async (username, password) => {
    token = null;
    try {
        const response = await axios.post(`${AUTH_BASE_URl}/login`, {
            username: username,
            password: password,
        });

        if (response.status === 200) {
            console.log("Login Success");
            token = response.access;
            console.log("Login Response : ", response);
        }

    } catch (error) {
        console.error("Login Failed : ", error);;
    }
    return token;
}

export const logoutUser = async (token) => {
    try {
        const response = await axios.post(`${AUTH_BASE_URl}/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        console.log("Logout Response : ", response);
        return true;
    } catch (error) {
        console.error("Logout Failed : ", error);
        return false;
    }
}

export const getUsersTeams = async (token) => {
    try {
        const response = await axios.get(`${CHAT_BASE_URl}/users/me/teams`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        console.log("Get Users Teams Response : ", response);
        return response;
    } catch (error) {
        console.error("Get Users Teams Failed : ", error);
        return null;
    }
}

export const getUsersChannels = async (teamId) => {
    try {
        const response = await axios.get(`${CHAT_BASE_URl}/users/me/teams/${teamId}/channels`, {
            withCredentials: true,
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Get Channels Failed : ", error);
        return null;
    }
}

export const getPosts = async (channelId) => {
    console.log("Channel ID : ", channelId);
    try {
        const response = await axios.get(`${BASE_URl}/channels/${channelId}/posts`, {
            withCredentials: true
    });
        console.log("Channel posts object : ", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Posts Failed : ", error);
        return null;
    }
}

export const sendMessage = async (channelId, message, username) => {
    try {
        const fullMessage = `${username}   :   ${message}`;
        const response = await axios.post(`${BASE_URl}/posts`, {
            channel_id: channelId,
            message: fullMessage,
        }, {
            withCredentials: true,
            headers: {
                'X-CSRF-Token': getCookie('MMCSRF'),
            }
        });

        console.log("Send Message Response : ", response);
        return response.data;
    } catch (error) {
        console.error("Send Message Failed : ", error);
        return null;
    }
}

export const getCurrentUser = async () => {
    try {
        const response = await axios.get(`${BASE_URl}/users/me`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error("Get Current User Failed : ", error);
        return null;
    }
}

export const addReaction = async (userid, postId, emojiName) => {
    try {
        const response = await axios.post(`${BASE_URl}/reactions`, {
            user_id: userid,
            post_id: postId,
            emoji_name: emojiName
        }, {
            withCredentials: true,
            headers: {
                'X-CSRF-Token': getCookie('MMCSRF'),
            }
        });
        return response.data;
    } catch (error) {
        console.error("Add Reaction Failed:", error);
        return null;
    }
};

export const removeReaction = async (postId, emojiName) => {
    try {
        const response = await axios.delete(
            `${BASE_URl}/users/me/posts/${postId}/reactions/${emojiName}`,
            {
                withCredentials : true,
                headers: {
                    'X-CSRF-Token': getCookie('MMCSRF'),
                }
            }
        );
        console.log(response)
        return true;
    } catch (error) {
        console.error("Remove Reaction Failed:", error);
        return false;
    }
};

export const deletePost = async (postId) => {
    try {
        const response = await axios.delete(`${BASE_URl}/posts/${postId}`, {
            withCredentials : true,
            headers: {
                'X-CSRF-Token': getCookie('MMCSRF'),
            }
        });
        return true;
    } catch (error) {
        console.error("Delete Post Failed:", error);
        return false;
    }
};