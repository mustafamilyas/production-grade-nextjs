import React, { FC } from 'react'
import hydrate from 'next-mdx-remote/hydrate'
import { majorScale, Pane, Heading, Spinner } from 'evergreen-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Post } from '../../types'
import Container from '../../components/container'
import HomeNav from '../../components/homeNav'
import path from 'path'
import fs from 'fs'
import matter from 'gray-matter'
import renderToString from 'next-mdx-remote/render-to-string'

const BlogPost: FC<Post> = ({ source, frontMatter }) => {
  const content = source ? hydrate(source) : ''
  const router = useRouter()

  if (router.isFallback) {
    return (
      <Pane width="100%" height="100%">
        <Spinner size={48} />
      </Pane>
    )
  }
  return (
    <Pane>
      <Head>
        <title>{`Known Blog | ${frontMatter.title}`}</title>
        <meta name="description" content={frontMatter.summary} />
      </Head>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          <Heading fontSize="clamp(2rem, 8vw, 6rem)" lineHeight="clamp(2rem, 8vw, 6rem)" marginY={majorScale(3)}>
            {frontMatter.title}
          </Heading>
          <Pane>{content}</Pane>
        </Container>
      </main>
    </Pane>
  )
}

BlogPost.defaultProps = {
  source: '',
  frontMatter: { title: 'default title', summary: 'summary', publishedOn: '' },
}

/**
 * Need to get the paths here
 * then the the correct post for the matching path
 * Posts can come from the fs or our CMS
 */

export function getStaticPaths() {
  const postsDirectory = path.join(process.cwd(), 'posts')
  const fileNames = fs.readdirSync(postsDirectory)
  const paths = fileNames.map((fileName) => ({
    params: {
      slug: fileName.replace(/\.mdx$/, ''),
    },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  let post
  try {
    const postsDirectory = path.join(process.cwd(), 'posts', `${params.slug}.mdx`)
    const postFromFile = fs.readFileSync(postsDirectory, 'utf8')
    const { content, data } = matter(postFromFile)
    post = { source: content, frontMatter: data }
  } catch (error) {
    const cmsPosts = require('../../content').posts.published
    const cmsPost = cmsPosts.find((p) => {
      const { data } = matter(p)
      return data.slug === params.slug
    })
    post = {
      source: cmsPost,
      frontMatter: matter(cmsPost).data,
    }
  }
  const mdxSource = await renderToString(post.source, { scope: post.frontMatter })

  return {
    props: {
      source: mdxSource,
      frontMatter: post.frontMatter,
    },
  }
}

export default BlogPost
