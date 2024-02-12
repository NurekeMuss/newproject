import { body } from "express-validator";

export const loginValidator = [
    body("username", 'Wrong format of fullname').isLength({ min: 3 }),
    body("password", 'Password should contain min 5 symbols').isLength({ min: 5 }),
];

export const registerValidation = [
    body("username", 'Write your name').isLength({ min: 3 }),
    body("password", 'Password should contain min 5 symbols').isLength({ min: 5 }),
];
