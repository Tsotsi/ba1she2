import UserAgent from 'user-agents'
import {scryptSync} from 'node:crypto'

export function main(){
  const userAgent = new UserAgent({platform:"MacIntel"})

  const appleColorUrl = 'https://developer.apple.com/design/human-interface-guidelines/foundations/color#best-practices'
  const fileName = scryptSync(appleColorUrl, 'salt', 32)
  console.log('main', userAgent.toString(),fileName.toString('hex') )
}

main()
