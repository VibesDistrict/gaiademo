'use client'

import Link from 'next/link'
import { useStoreSettings } from '@/lib/settings-context'
import { storeContactWhatsAppUrl } from '@/lib/social'
import { StoreSocialLinks } from '@/components/layout/StoreSocialLinks'
import { LoadingMessage, PrimaryButton, SectionTitle } from '@/components/ui'

export default function ContactoPage() {
  const { settings } = useStoreSettings()

  const waUrl = settings?.whatsapp
    ? storeContactWhatsAppUrl(settings.whatsapp)
    : null

  return (
    <div className="gp-fade-in space-y-5">
      <SectionTitle
        title="Contacto"
        subtitle="Escríbenos o síguenos en redes"
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-bold">WhatsApp directo</p>
        <p className="mt-1 text-sm text-[var(--gp-muted)]">
          Dudas sobre pedidos, horarios, delivery o pedidos especiales.
        </p>
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noreferrer" className="mt-4 block">
            <PrimaryButton type="button" className="w-full bg-[#25D366] shadow-none">
              Abrir WhatsApp
            </PrimaryButton>
          </a>
        ) : (
          <p className="mt-3 text-sm text-[var(--gp-muted)]">
            WhatsApp no configurado todavía.
          </p>
        )}
      </div>

      {settings?.open_hours ? (
        <div className="rounded-2xl bg-[var(--gp-cream)] px-4 py-3 text-sm">
          <p className="font-bold">Horario</p>
          <p className="mt-1 text-[var(--gp-muted)]">{settings.open_hours}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
          Redes sociales
        </p>
        {settings ? (
          <StoreSocialLinks settings={settings} variant="cards" />
        ) : (
          <LoadingMessage />
        )}
        {settings &&
        !settings.instagram &&
        !settings.tiktok &&
        !settings.facebook ? (
          <p className="text-sm text-[var(--gp-muted)]">
            Pronto compartiremos nuestras redes aquí.
          </p>
        ) : null}
      </div>

      <p className="text-center text-xs text-[var(--gp-muted)]">
        ¿Prefieres dejar un comentario privado?{' '}
        <Link href="/sugerencias" className="font-semibold text-[var(--gp-red)]">
          Enviar sugerencia
        </Link>
      </p>
    </div>
  )
}
