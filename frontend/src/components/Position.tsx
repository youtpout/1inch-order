'use client'


import { getPositionUrl } from "@/utils/addresses";
export default function Position({ manager, nft, chain }: any) {

    return (
        <>
            <div className='nft-image'>
                <img src={nft.metadata?.image} alt='Position loading ...'></img>
                <div className="nft-info">
                    <h4>
                        <a style={{ "textDecoration": "underline" }} target="blank" href={getPositionUrl(manager, nft.tokenId)}>Position Id : {nft.tokenId}</a>
                        {nft.inRange ? <div style={{ color: "green" }}>In range</div> : <div style={{ color: "red" }}>Out of Range</div>}
                    </h4>
                    <h3>
                        {nft.metadata.name}
                    </h3>
                </div>
            </div>
        </>
    );
}
