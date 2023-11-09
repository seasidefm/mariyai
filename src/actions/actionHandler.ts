import { getBotInstance } from '../bot'
import { getLogger } from '../logger'
import { ServerWebSocket } from 'bun'

const logger = getLogger('server')
const bot = getBotInstance()

export enum Action {
    FirstLoad = 'FIRST_LOAD',
    Ping = 'PING',
    Pong = 'PONG',

    // Duck state
    GetState = 'GET_STATE',
    Spawn = 'SPAWN',
    Jump = 'JUMP',
    SetDuckSize = 'SET_DUCK_SIZE',
    Run = 'RUN',
}

export type Payload =
    | {
          action: Action.FirstLoad
          data: {
              clientName: string
          }
      }
    | {
          action: Action.Ping
          data: {
              timestamp: number
          }
      }
    | {
          action: Action.Pong
          data: {
              timestamp: number
          }
      }
    | {
          action: Action.GetState
      }
    | {
          action: Action.Spawn
          data: {
              username: string
              color: string
              scale: number // default 1
          }
      }
    | {
          action: Action.Jump
          data: {
              username: string
          }
      }
    | {
          action: Action.SetDuckSize
          data: {
              username: string
              scale: number
          }
      }
    | {
          action: Action.Run
          data: {
              username: string
          }
      }

export async function actionHandler(
    msg: string,
    _ws: ServerWebSocket<unknown>,
) {
    try {
        const data: Payload = JSON.parse(msg.toString())

        switch (data.action) {
            case Action.FirstLoad: {
                bot.addSocket(data.data.clientName, _ws as ServerWebSocket)

                break
            }

            case Action.GetState: {
                _ws.send(JSON.stringify({ state: 'woohoo' }))
                break
            }

            default: {
                const error = `Cannot find action in payload: ` + msg
                logger.error(error)

                _ws.send(error)
            }
        }
    } catch (e) {
        logger.error(`Cannot parse JSON from msg: ${msg}`)
        _ws.send(
            JSON.stringify({
                error: 'Cannot parse JSON, please check payload',
            }),
        )
    }
}
