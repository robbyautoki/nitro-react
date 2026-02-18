import { GetPromoArticlesComposer, PromoArticleData, PromoArticlesMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, OpenUrl, SendMessageComposer } from '../../../../../api';
import { useMessageEvent } from '../../../../../hooks';

export const PromoArticleWidgetView: FC<{}> = props =>
{
    const [ articles, setArticles ] = useState<PromoArticleData[]>(null);
    const [ index, setIndex ] = useState(0);

    useMessageEvent<PromoArticlesMessageEvent>(PromoArticlesMessageEvent, event =>
    {
        const parser = event.getParser();
        setArticles(parser.articles);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetPromoArticlesComposer());
    }, []);

    if(!articles) return null;

    return (
        <div className="promo-articles widget mb-2">
            <div className="flex flex-row items-center w-full mb-1">
                <small className="shrink-0 pr-1">{ LocalizeText('landing.view.promo.article.header') }</small>
                <hr className="w-full my-0"/>
            </div>
            <div className="flex flex-row mb-1">
                { articles && (articles.length > 0) && articles.map((article, ind) =>
                    <div className={ 'promo-articles-bullet cursor-pointer ' + (article === articles[index] ? 'promo-articles-bullet-active' : '') } key={ article.id } onClick={ event => setIndex(ind) } />
                ) }
            </div>
            { articles && articles[index] &&
                <div className="promo-article flex flex-row row mx-0">
                    <div className="promo-article-image" style={ { backgroundImage: `url(${ articles[index].imageUrl })` } }/>
                    <div className="col-3 flex flex-col h-full">
                        <h3 className="my-0">{ articles[index].title }</h3>
                        <b>{ articles[index].bodyText }</b>
                        <button className="btn btn-sm mt-auto btn-gainsboro" onClick={ event => OpenUrl(articles[index].linkContent) }>{ articles[index].buttonText }</button>
                    </div>
                </div> }
        </div>
    );
}
