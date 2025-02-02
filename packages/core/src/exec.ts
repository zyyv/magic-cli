import path from 'path'
import { Package } from '@vbs/magic-cli-models'
import {
  DEFAULT_PACKAGE_VERSION,
  DEFAULT_STORE_PATH,
  DEFAULT_STORE_SUFIX,
  PACKAGE_SETTINGS,
  spawn,
  useLogger,
} from '@vbs/magic-cli-utils'
import type { Command } from 'commander'

export const exec = async(...args: any[]) => {
  let TP_PATH = process.env.TARGET_PATH
  const HOME_PATH = process.env.MAGIC_CLI_HOME_PATH
  // 缓存目录
  let STORE_PATH = ''
  const cmd: Command = args[args.length - 1]
  const curCommand = cmd.name() as keyof typeof PACKAGE_SETTINGS
  const PACKAGE_NAME = PACKAGE_SETTINGS[curCommand]
  const PACKAGE_VERSION = DEFAULT_PACKAGE_VERSION
  let pkg: Package
  const { debug, error } = useLogger()

  if (TP_PATH) {
    // 直接赋值
    pkg = new Package({
      TP_PATH,
      STORE_PATH,
      PACKAGE_NAME,
      PACKAGE_VERSION,
    })
  } else {
    // 走全局缓存目录 ex:/Users/zhongan/.magic-cli/dependenices
    TP_PATH = path.resolve(HOME_PATH!, DEFAULT_STORE_PATH)
    STORE_PATH = path.resolve(TP_PATH, DEFAULT_STORE_SUFIX)

    pkg = new Package({
      TP_PATH,
      STORE_PATH,
      PACKAGE_NAME,
      PACKAGE_VERSION,
    })

    debug(pkg)
    debug(`exist:${await pkg.exists()}`)

    // 判断缓存目录是否已存在
    if (await pkg.exists()) {
      debug('Perform the update')
      await pkg.update()
    } else {
      debug('Perform initialization')
      await pkg.init()
    }
  }

  const execFilePath = await pkg.getRootFilePath()
  if (!execFilePath)
    throw new Error(error('The folder path specified is incorrect!', { needConsole: false }))

  debug(`execFilePath:${execFilePath}`)
  debug(`TP_PATH:${TP_PATH}`)
  debug(`STORE_PATH:${STORE_PATH}`)
  debug(`PACKAGE_NAME:${pkg.PACKAGE_NAME}`)
  debug(`PACKAGE_VERSION:${pkg.PACKAGE_VERSION}`)

  try {
    const params = [...args]
    const _suffixObject = Object.create(null)
    const commanderObject = params[params.length - 1]
    Object.keys(commanderObject).forEach((key) => {
      if (commanderObject.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent')
        _suffixObject[key] = commanderObject[key]
    })
    params[params.length - 1] = _suffixObject

    // 开启多进程执行命令代码
    const child = spawn(
      'node',
      [execFilePath, `${JSON.stringify(params)}`],
      {
        cwd: process.cwd(),
        stdio: 'inherit' as any,
      },
    )

    child.on('error', (e: Error) => {
      error(`Multi-process code execution exception: ${e.message}`)
      process.exit(1)
    })

    child.on('exit', (e: number) => {
      debug(`${curCommand} The command was executed successfully`)
      process.exit(e)
    })
  } catch (e: any) {
    error(`catch error ${e.message}`)
  }
}
