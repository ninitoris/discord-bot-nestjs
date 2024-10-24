import { Injectable, Logger } from '@nestjs/common';
import {
  IApprovalsInfo,
  type UserInfo,
} from '@src/gitlab-webhook/gitlab-webhook.types';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GitLabApiService {
  private axios: AxiosInstance;

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
    const url = `/${projectId}/merge_requests/${mergeRequestId}/approvals`;
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

  async getUserInfo(username: string): Promise<UserInfo | null> {
    try {
      const url = `/users?username=${username}`;
      const response = await this.axios.get(url);

      if (response) return response.data;
    } catch (error) {
      new Logger(error);
      return;
    }
  }
}
