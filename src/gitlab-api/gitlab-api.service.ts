import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import {
  IApprovalsInfo,
  type UserInfo,
} from '@src/gitlab-webhook/gitlab-webhook.types';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GitLabApiService {
  private axios: AxiosInstance;
  private readonly logger = new Logger(GitLabApiService.name);

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get(ENVIRONMENT_KEY.GITLAB_TOKEN);
    if (!token) {
      throw new Error('No GitLab token in env');
    }
    const baseHost = this.configService.get(ENVIRONMENT_KEY.GITLAB_BASE_HOST);
    const apiPostfix = this.configService.get(
      ENVIRONMENT_KEY.GITLAB_API_POSTFIX,
    );
    if (!baseHost || !apiPostfix) {
      throw new Error('No GitLab url or api postfix in env');
    }
    const url = baseHost + apiPostfix;
    this.axios = axios.create({
      baseURL: url,
      headers: {
        'PRIVATE-TOKEN': token,
      },
    });
  }

  async getMergeRequestApprovalsInfo(
    projectId: number,
    mergeRequestId: number,
  ): Promise<IApprovalsInfo | undefined> {
    const url = `/projects/${projectId}/merge_requests/${mergeRequestId}/approvals`;

    return this.axios
      .get(url)
      .then((res) => {
        const approvals: IApprovalsInfo = res.data;
        return approvals;
      })
      .catch((error) => {
        if (error.code === 'ECONNREFUSED') {
          console.log('скорее всего протух сертификат либо гитлаб лежит');
          // TODO: вот тут по идее если ошибка ECONNREFUSED то ее надо обработать по-особому, кинуть уведомление и тд. Если это другая ошибка, то можно ее просто залогировать в общий пулл ошибок. При этом обработка ошибок должна осуществляться централизованно
          return undefined;
        } else {
          console.log('хз че за ошибка');
          throw error;
        }
      });
  }

  // Получение информации о пользователе в гитлабе по его username из url
  async getUserInfo(username: string): Promise<UserInfo | undefined>;
  async getUserInfo(userId: number): Promise<UserInfo | undefined>;
  async getUserInfo(
    userNameOrID: string | number,
  ): Promise<UserInfo | undefined> {
    if (typeof userNameOrID === 'string') {
      try {
        const username = userNameOrID;
        const response = await this.axios.get(`/users?username=${username}`);

        if (
          response &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          return response.data[0];
        }

        return undefined;
      } catch (error) {
        this.logger.error(
          `Error fetching user info for username: ${userNameOrID}`,
          error.stack,
        );

        return undefined;
      }
    } else if (typeof userNameOrID === 'number') {
      try {
        const userID = userNameOrID;
        const response = await this.axios.get(`/users/${userID}`);

        if (response?.data) {
          return response.data;
        }

        return undefined;
      } catch (error) {
        this.logger.error(
          `Error fetching user info for userID: ${userNameOrID}`,
          error.stack,
        );

        return undefined;
      }
    }
  }
}
