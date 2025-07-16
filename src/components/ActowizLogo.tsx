import Image from 'next/image';

export default function ActowizLogo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ position: 'relative' }}>
        <Image
            src="https://www.actowizsolutions.com/assets/new-img/logo/Actowiz-Logo-color-neww.svg"
            alt="Actowiz KRT Logo"
            layout="fill"
            objectFit="contain"
        />
    </div>
  );
}
