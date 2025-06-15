import smallIcon from '@/public/icons/icon-192x192.png';
import largeIcon from '@/public/icons/icon-512x512.png';
import transparentHeader from "@/public/icons/transparent-header.png"
import transparentHeaderOutline from "@/public/icons/transparent-header-outline.png"
import coverImage from "@/assets/img/coverImageST.png"
import loginImage from "@/assets/img/loginpagecover.png"
import headerImage from "@/public/icons/globeheader.png"

const basicInfo = {
    name: 'Strakatá turistika',
    quote: "aneb poznáváme Česko s českým strakatým psem",
    description: 'Aplikace pro soutěž spolku českého strakatého psa',
    img: {
        icons: {
            small: smallIcon,
            large: largeIcon,
            transparentHeader: headerImage,
            transparentHeaderOutline: headerImage,
        },
        coverImage: coverImage,
        loginImage: loginImage
    },
};

export default basicInfo