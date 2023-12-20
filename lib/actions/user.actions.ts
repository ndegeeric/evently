'use server';

import { CreateUserParams } from "@/types";
import { handleError } from "../utils";
import { connectionToDatabase } from "../database";
import User from "../mongodb/database/models/user.model";

export const createUser = async (user: CreateUserParams) => {
    try {
        await connectionToDatabase();

        const newUser = await User.create(user);

        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        handleError(error);
    }
}