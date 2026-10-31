-- Fontes iniciais. reliability_score é uma estimativa inicial a calibrar pelo time.
-- feed_url fica vazio: cadastre o RSS de cada fonte após validar o endereço.
insert into sources (source_name, source_url, reliability_score) values
  ('Diário Oficial do Estado do Maranhão', 'https://www.diariooficial.ma.gov.br', 90),
  ('Portal Nacional de Contratações Públicas (PNCP)', 'https://pncp.gov.br', 90),
  ('Receita Federal — dados CNPJ', 'https://www.gov.br/receitafederal', 85),
  ('Imprensa regional', null, 60),
  ('Redes sociais / site da empresa', null, 50),
  ('Indicação de vendedor', null, 70);

-- Não há empresas no seed: o PRD proíbe recomendações sem evidência rastreável.
-- Para dados de demonstração, rode a aplicação sem Supabase (modo demo).
