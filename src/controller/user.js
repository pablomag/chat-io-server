import { trimToLowerCase } from "../common/helper.js";

const users = [];

export const addUser = ({ id, name, chatRoom }) => {
    const userExists = users.find(
        (user) => trimToLowerCase(user.name) === trimToLowerCase(name)
    );
    if (userExists) {
        return { error: "Username already in use" };
    }

    const user = { id, name, chatRoom };

    users.push(user);

    return { user };
};

export const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
    console.log("logged in users:", users);
};

export const getUser = (id) => users.find((user) => user.id === id);

export const getUsersInRoom = (chatRoom) =>
    users.filter((user) => user.chatRoom === chatRoom);
