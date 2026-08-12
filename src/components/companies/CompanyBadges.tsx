import { Globe, MessageCircle, Phone } from 'lucide-react'
import type { Company } from '@/types'
import { Badge } from '@/components/ui/badge'

/** Badges de canais de contato disponíveis — somente os que a empresa possui. */
export function CompanyBadges({ company }: { company: Company }) {
  const hasAny = company.telefone || company.whatsapp || company.website
  if (!hasAny) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {company.telefone && (
        <Badge variant="outline">
          <Phone className="h-2.5 w-2.5" /> Telefone
        </Badge>
      )}
      {company.whatsapp && (
        <Badge variant="outline">
          <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
        </Badge>
      )}
      {company.website && (
        <Badge variant="outline">
          <Globe className="h-2.5 w-2.5" /> Site
        </Badge>
      )}
    </div>
  )
}
