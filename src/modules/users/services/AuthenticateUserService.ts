import { sign } from 'jsonwebtoken'
import { injectable, inject } from 'tsyringe'

import IHashProvider from '../providers/HashProvider/models/IHashProvider'
import IUserRepository from '../repositories/IUsersRepository'
import authConfig from '@config/auth'
import User from '../infra/typeorm/entities/User'
import AppError from '@shared/errors/AppError'

interface IRequest {
    email: string
    password: string
}

interface IResponse {
    user: User
    token: string
}

@injectable()
class AuthenticateUserService {
    constructor(
        @inject('UsersRepository')
        private usersRepository: IUserRepository,

        @inject('HashProvider')
        private hashProvider: IHashProvider,
    ) { }

    public async execute({ email, password }: IRequest): Promise<IResponse> {
        const user = await this.usersRepository.findByEmail(email)
        if (!user) {
            throw new AppError('Combinação de email incorreta!', 401)
        }
        const passworMatched = await this.hashProvider.compareHash(
            password,
            user.password,
        )
        if (!passworMatched) {
            throw new AppError('Combinação de password incorreta!', 401)
        }
        const { secret, expiresIn } = authConfig.jwt
        const token = sign({}, secret, {
            subject: user.id,
            expiresIn,
        })
        return {
            user,
            token,
        }
    }
}

export default AuthenticateUserService
