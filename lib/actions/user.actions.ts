'use server';

import { revalidatePath } from "next/cache";

import { CreateUserParams, UpdateUserParams } from "@/types";
import { handleError } from "../utils";
import { connectionToDatabase } from "../database";
import User from "../database/models/user.model";
import Event from "../database/models/event.models";
import OrderSchema from "../database/models/order.models";

export const getUserById = async (userId: string) => {
    try {
       await connectionToDatabase();
       
       const user = await User.findById(userId);

       if (!user) throw new Error(`User ${userId} not found`);
       return JSON.parse(JSON.stringify(user));
    } catch (error) {
        handleError(error);
    }
}

export const createUser = async (user: CreateUserParams) => {
    try {
        await connectionToDatabase();

        const newUser = await User.create(user);

        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        handleError(error);
    }
}

export const updateUser = async (clerkId: string, user: UpdateUserParams) => {
    try {
        await connectionToDatabase();

        const updatedUser = await User.findOneAndUpdate({ clerkId }, user, { new: true });

        if (!updatedUser) throw new Error(`User update failed`);

        return JSON.parse(JSON.stringify(updatedUser));
    } catch (error) {
        handleError(error);
    }
}

export const deleteUser = async (clerkId: string) => {
    try {
        await connectionToDatabase();

        //find the user to be deleted.
        const userToDelete = await User.findOne({ clerkId });

        //if not found throw error
        if(!userToDelete) throw new Error(`User not found`);
        
        //unlink relationships
        await Promise.all([
            //Update the 'events' collection to remove references to the user.
            Event.updateMany(
                { _id: { $in: userToDelete.events } },
                { $pull: { organizer: userToDelete._id } },
            ),

            //Update the 'orders' collection to remove references to the user.

            OrderSchema.updateMany(
                { _id: { $in: userToDelete.orders} },
                { $unset: { buyer: 1 }}
            )
        ])

        //Delete the user
        const deletedUser = await User.findByIdAndDelete(userToDelete._id);
        revalidatePath('/')

        return deletedUser ? JSON.parse(JSON.stringify(deletedUser)): null

    } catch (error) {
        handleError(error);
    }
}