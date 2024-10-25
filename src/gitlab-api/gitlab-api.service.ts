import { Injectable, Logger } from '@nestjs/common';
import {
  IApprovalsInfo,
  type UserInfo,
} from '@src/gitlab-webhook/gitlab-webhook.types';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GitLabApiService {
  private axios: AxiosInstance;
  private readonly logger = new Logger(GitLabApiService.name);

  constructor() {
    const token = process.env.GITLAB_TOKEN;
    if (!token) {
      throw new Error('No GitLab token in env');
    }
    const url = process.env.GITLAB_API_URL;
    if (!url) {
      throw new Error('No GitLab API url in env');
    }
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
  ): Promise<IApprovalsInfo | null> {
    const url = `/projects/${projectId}/merge_requests/${mergeRequestId}/approvals`;
    // console.log('querying: ' + process.env.GITLAB_API_URL + url);
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
          return null;
        } else {
          console.log('хз че за ошибка');
          throw error;
        }
      });
  }

  // Запрос на получение информации о пользователе в гитлабе по его username из url
  async getUserInfo(username: string): Promise<UserInfo | null> {
    try {
      const response = await this.axios.get(`/users?username=${username}`);

      if (response && Array.isArray(response.data) && response.data.length > 0)
        return response.data[0];
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching user info for username: ${username}`,
        error.stack,
      );

      return null;
    }
  }
}
